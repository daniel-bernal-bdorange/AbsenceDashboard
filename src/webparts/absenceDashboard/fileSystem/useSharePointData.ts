import { useCallback, useEffect, useState } from 'react';
import { SPHttpClient } from '@microsoft/sp-http';
import * as XLSX from 'xlsx';

import { useTranslation } from '../i18n/useTranslation';
import { parseExcelFile, parseSpreadsheetXmlFile, parseRegulFile } from '../api/excelParser';
import {
  loadDepartmentMap,
  loadRosterFile,
  isRosterExcelFile,
  isRosterJsonFile,
} from './departmentMapper';
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
  const { t: tErrors } = useTranslation('errors');
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

    if (!ausenciasUrl) {
      setError(tErrors('libUrlNotConfigured'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const processedFileNotes: string[] = [];

      // --- Roster folder: procesa TODOS los ficheros y mergea por Code ---
      // Excel: extrae departamento + arrival date escaneando todas las hojas.
      // JSON: extrae sólo mappings de departamento (legacy).
      // Las filas sin `Arrival date` se ignoran para entitlement; el primer
      // valor encontrado por code prevalece sobre los siguientes.
      const departmentMap = new Map<string, Department>();
      const arrivalDates = new Map<string, Date>();

      if (rosterUrl) {
        const rosterFiles = await listFolderFiles(client, siteAbsUrl, siteRelUrl, rosterUrl);

        for (const file of rosterFiles) {
          if (isRosterJsonFile(file.name)) {
            const deptOnly = await loadDepartmentMap(client, siteAbsUrl, file.serverRelativeUrl);
            let added = 0;
            deptOnly.forEach((v, k) => {
              if (!departmentMap.has(k)) {
                departmentMap.set(k, v);
                added += 1;
              }
            });
            processedFileNotes.push(file.name);
            console.debug(`[Roster JSON] ${file.name} -> +${added} departments`);
            continue;
          }

          if (!isRosterExcelFile(file.name)) continue;

          try {
            const { departments, arrivals } = await loadRosterFile(
              client,
              siteAbsUrl,
              file.serverRelativeUrl,
            );

            let deptAdded = 0;
            let arrAdded = 0;
            departments.forEach((v, k) => {
              if (!departmentMap.has(k)) {
                departmentMap.set(k, v);
                deptAdded += 1;
              }
            });
            arrivals.forEach((v, k) => {
              if (!arrivalDates.has(k)) {
                arrivalDates.set(k, v);
                arrAdded += 1;
              }
            });

            processedFileNotes.push(file.name);
            console.debug(
              `[Roster Excel] ${file.name} -> +${deptAdded} dept, +${arrAdded} arrival`,
            );
          } catch (err) {
            console.error('Error parsing roster file', file.name, ':', err);
          }
        }

        console.debug(
          `[Roster total] ${departmentMap.size} departments, ${arrivalDates.size} arrival dates`,
        );
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

          processedFileNotes.push(file.name);
          console.debug(`[Absences] ${file.name} -> parseExcelFile/parseSpreadsheetXmlFile + dedup by code|type|from|till`);
        } catch (err) {
          console.error('Error parsing absence file', file.name, ':', err);
        }
      }

      if (rawRecords.length === 0) {
        throw new Error(tErrors('noValidAbsenceFiles'));
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
            processedFileNotes.push(file.name);
            console.debug(`[Regul] ${file.name} -> parseRegulFile; only known absence row types`);
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
      const message = err instanceof Error ? err.message : tErrors('unknownError');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [setRecords, setRegulRecords, setVacationStats, setProcessedFileNotes, tErrors]);

  useEffect(() => {
    loadData().catch(() => { /* Error handled by state */ });
  }, [loadData]);

  return { isLoading, error, dataLoaded };
}

