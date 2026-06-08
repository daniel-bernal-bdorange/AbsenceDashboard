import { useCallback, useEffect, useState } from 'react';
import { SPHttpClient } from '@microsoft/sp-http';
import * as XLSX from 'xlsx';

import { parseExcelFile, parseSpreadsheetXmlFile, parseRegulFile } from '../api/excelParser';
import { loadDepartmentMap, loadFocusRoster } from './departmentMapper';
import { deduplicateRecords } from '../utils/deduplicateRecords';
import { computeVacationStats } from '../utils/vacationEntitlement';
import { useAppStore } from '../store/useAppStore';
import { appEnv, getSpHttpClient, getSiteAbsoluteUrl, getSiteServerRelativeUrl } from '../config/env';
import type { AbsenceRecord, Department, RegulRecord } from '../types';

type UseSharePointDataReturn = {
  isLoading: boolean;
  error: string | null;
  dataLoaded: boolean;
};

const isExcelFile = (fileName: string) => /\.(xlsx|xls)$/i.test(fileName);

type FileEntry = { name: string; serverRelativeUrl: string };

const listFolderFiles = async (
  client: SPHttpClient,
  siteAbsUrl: string,
  siteRelUrl: string,
  libraryRelPath: string,
): Promise<FileEntry[]> => {
  const folderRelPath = `${siteRelUrl.replace(/\/+$/, '')}/${libraryRelPath.replace(/^\/+/, '')}`;
  const folderApiUrl = `${siteAbsUrl}/_api/web/GetFolderByServerRelativeUrl('${encodeURIComponent(folderRelPath)}')/Files`;
  const response = await client.get(folderApiUrl, SPHttpClient.configurations.v1);

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return (data.value ?? []).map((f: Record<string, unknown>) => ({
    name: String(f.Name ?? ''),
    serverRelativeUrl: String(f.ServerRelativeUrl ?? ''),
  }));
};

const fetchFileBuffer = async (
  client: SPHttpClient,
  siteAbsUrl: string,
  serverRelativeUrl: string,
): Promise<ArrayBuffer | null> => {
  const url = `${siteAbsUrl}/_api/web/GetFileByServerRelativeUrl('${encodeURIComponent(serverRelativeUrl)}')/$value`;
  const response = await client.get(url, SPHttpClient.configurations.v1);
  return response.ok ? response.arrayBuffer() : null;
};

const enrichWithDepartment = (
  records: AbsenceRecord[],
  departmentMap: Map<string, Department>,
): AbsenceRecord[] =>
  records.map((record) => ({
    ...record,
    department: departmentMap.get(record.employeeUsername.toLowerCase()) ?? 'Unknown',
  }));

export function useSharePointData(): UseSharePointDataReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const setRecords = useAppStore((state) => state.setRecords);
  const setRegulRecords = useAppStore((state) => state.setRegulRecords);
  const setVacationStats = useAppStore((state) => state.setVacationStats);
  const setProcessedFileNotes = useAppStore((state) => state.setProcessedFileNotes);

  const loadData = useCallback(async () => {
    const client = getSpHttpClient();
    const siteAbsUrl = getSiteAbsoluteUrl();
    const siteRelUrl = getSiteServerRelativeUrl();
    const ausenciasUrl = appEnv.ausenciasLibraryUrl;
    const regulUrl = appEnv.regulLibraryUrl;
    const rosterUrl = appEnv.rosterLibraryUrl;
    const rosterFileName = appEnv.rosterFileName;

    if (!ausenciasUrl) {
      setError('Library URL not configured');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const processedFileNotes: string[] = [];

      // --- Roster: OBD (department map) + FOCUS (arrival dates) ---
      let departmentMap = new Map<string, Department>();
      let arrivalDates = new Map<string, Date>();

      if (rosterUrl) {
        const rosterFiles = await listFolderFiles(client, siteAbsUrl, siteRelUrl, rosterUrl);

        const obdFile = rosterFiles.find((f) => f.name === rosterFileName);
        if (obdFile) {
          departmentMap = await loadDepartmentMap(client, siteAbsUrl, obdFile.serverRelativeUrl);
          processedFileNotes.push(`Roster OBD: ${obdFile.name} -> Code/Department map (${departmentMap.size} empleados)`);
        }

        const focusFile = rosterFiles.find((f) => /focus/i.test(f.name) && isExcelFile(f.name));
        if (focusFile) {
          arrivalDates = await loadFocusRoster(client, siteAbsUrl, focusFile.serverRelativeUrl);
          processedFileNotes.push(`Roster FOCUS: ${focusFile.name} -> Code/Arrival date para entitlement (${arrivalDates.size} empleados)`);
        }
      }

      // --- Ausencias ---
      const absenceFiles = await listFolderFiles(client, siteAbsUrl, siteRelUrl, ausenciasUrl);
      const rawRecords: AbsenceRecord[] = [];

      for (const file of absenceFiles) {
        if (!isExcelFile(file.name)) continue;

        try {
          const buffer = await fetchFileBuffer(client, siteAbsUrl, file.serverRelativeUrl);
          if (!buffer) continue;

          const uint8 = new Uint8Array(buffer);
          if (uint8[0] === 0x3C) {
            const text = new TextDecoder('utf-8').decode(buffer);
            rawRecords.push(...parseSpreadsheetXmlFile(text, file.name));
          } else {
            const workbook = XLSX.read(buffer, { type: 'array' });
            rawRecords.push(...parseExcelFile(workbook, file.name));
          }

          processedFileNotes.push(`Ausencias: ${file.name} -> parseExcelFile/parseSpreadsheetXmlFile y dedup por code|type|from|till`);
        } catch (err) {
          console.error('Error parsing absence file', file.name, ':', err);
        }
      }

      if (rawRecords.length === 0) {
        throw new Error('No se encontraron ficheros Excel válidos en Ausencias.');
      }

      const dedupedRecords = deduplicateRecords(rawRecords);
      const enriched = enrichWithDepartment(dedupedRecords, departmentMap);
      setRecords(enriched, ausenciasUrl);

      // --- Regularizaciones ---
      const regulRecords: RegulRecord[] = [];

      if (regulUrl) {
        const regulFiles = await listFolderFiles(client, siteAbsUrl, siteRelUrl, regulUrl);

        for (const file of regulFiles) {
          if (!isExcelFile(file.name)) continue;

          try {
            const buffer = await fetchFileBuffer(client, siteAbsUrl, file.serverRelativeUrl);
            if (!buffer) continue;

            const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
            regulRecords.push(...parseRegulFile(workbook, file.name));
            processedFileNotes.push(`Regularizaciones: ${file.name} -> parseRegulFile; solo row types de ausencias conocidas`);
          } catch (err) {
            console.error('Error parsing regul file', file.name, ':', err);
          }
        }
      }

      setRegulRecords(regulRecords);
      setProcessedFileNotes(processedFileNotes);

      // --- Vacation stats ---
      const currentYear = new Date().getFullYear();
      const statsMap = computeVacationStats(enriched, arrivalDates, currentYear);
      const statsRecord: Record<string, import('../types').VacationStats> = {};
      statsMap.forEach((v, k) => { statsRecord[k] = v; });
      setVacationStats(statsRecord);

      setDataLoaded(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [setRecords, setRegulRecords, setVacationStats]);

  useEffect(() => {
    loadData().catch(() => { /* Error handled by state */ });
  }, [loadData]);

  return { isLoading, error, dataLoaded };
}

