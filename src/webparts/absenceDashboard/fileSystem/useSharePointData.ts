import { useCallback, useEffect, useState } from 'react';
import { SPHttpClient } from '@microsoft/sp-http';
import * as XLSX from 'xlsx';

import { parseExcelFile, parseSpreadsheetXmlFile } from '../api/excelParser';
import { loadDepartmentMap } from './departmentMapper';
import { useAppStore } from '../store/useAppStore';
import { appEnv, getSpHttpClient, getSiteAbsoluteUrl, getSiteServerRelativeUrl } from '../config/env';
import type { AbsenceRecord, Department } from '../types';

type UseSharePointDataReturn = {
  isLoading: boolean;
  error: string | null;
  dataLoaded: boolean;
};

const isExcelFile = (fileName: string) => /\.(xlsx|xls)$/i.test(fileName);

const enrichWithDepartment = (
  records: AbsenceRecord[],
  departmentMap: Map<string, Department>,
) => {
  return records.map((record) => ({
    ...record,
    department: departmentMap.get(record.employeeUsername.toLowerCase()) ?? 'Unknown',
  }));
};

export function useSharePointData(): UseSharePointDataReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const setRecords = useAppStore((state) => state.setRecords);

  const loadData = useCallback(async () => {
    const client = getSpHttpClient();
    const siteAbsUrl = getSiteAbsoluteUrl();
    const siteRelUrl = getSiteServerRelativeUrl();
    const libraryUrl = appEnv.libraryUrl;
    const rosterFileName = appEnv.rosterFileName;

    if (!libraryUrl) {
      setError('Library URL not configured');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const folderRelPath = `${siteRelUrl.replace(/\/+$/, '')}/${libraryUrl.replace(/^\/+/, '')}`;
      const folderApiUrl = `${siteAbsUrl}/_api/web/GetFolderByServerRelativeUrl('${encodeURIComponent(folderRelPath)}')/Files`;
      const listResponse = await client.get(folderApiUrl, SPHttpClient.configurations.v1);

      if (!listResponse.ok) {
        throw new Error(`Failed to list library files: ${listResponse.status}`);
      }

      const listData = await listResponse.json();
      const files: Array<{ name: string; serverRelativeUrl: string }> = (listData.value || []).map(
        (f: Record<string, unknown>) => ({
          name: String(f.Name ?? ''),
          serverRelativeUrl: String(f.ServerRelativeUrl ?? ''),
        }),
      );

      let departmentMap = new Map<string, Department>();

      if (rosterFileName) {
        const rosterFile = files.find((f) => f.name === rosterFileName);

        if (rosterFile) {
          departmentMap = await loadDepartmentMap(client, siteAbsUrl, rosterFile.serverRelativeUrl);
        }
      }

      const records: AbsenceRecord[] = [];

      for (const file of files) {
        if (!isExcelFile(file.name)) {
          continue;
        }

        if (file.name === rosterFileName) {
          continue;
        }

        try {
          const fileApiUrl = `${siteAbsUrl}/_api/web/GetFileByServerRelativeUrl('${encodeURIComponent(file.serverRelativeUrl)}')/$value`;
          const fileResponse = await client.get(fileApiUrl, SPHttpClient.configurations.v1);

          if (!fileResponse.ok) {
            console.error(`Failed to fetch ${file.name}: ${fileResponse.status}`);
            continue;
          }

          const arrayBuffer = await fileResponse.arrayBuffer();
          const uint8 = new Uint8Array(arrayBuffer);

          if (uint8[0] === 0x3C) {
            const text = new TextDecoder('utf-8').decode(arrayBuffer);
            const parsed = parseSpreadsheetXmlFile(text, file.name);
            records.push(...parsed);
          } else {
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const parsed = parseExcelFile(workbook, file.name);
            records.push(...parsed);
          }
        } catch (err) {
          console.error('Error parsing', file.name, ':', err);
        }
      }

      if (records.length === 0) {
        throw new Error('No se encontraron ficheros Excel válidos en la biblioteca.');
      }

      const enriched = enrichWithDepartment(records, departmentMap);
      setRecords(enriched, libraryUrl);
      setDataLoaded(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [setRecords]);

  useEffect(() => {
    loadData().catch(() => { /* Error handled by state */ });
  }, [loadData]);

  return { isLoading, error, dataLoaded };
}
