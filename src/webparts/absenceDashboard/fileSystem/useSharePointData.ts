import { useCallback, useEffect, useState } from 'react';
import { SPHttpClient } from '@microsoft/sp-http';
import * as XLSX from 'xlsx';

import { useTranslation } from '../i18n/useTranslation';
import { getAbsenceCategory, parseExcelFile, parseSpreadsheetXmlFile, parseRegulFile, parseExceptionsFile } from '../api/excelParser';
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
import { AbsenceStatus } from '../types';
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

const normalizeDay = (date: Date): number => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized.getTime();
};

const applyRegularizations = (records: AbsenceRecord[], regulRecords: RegulRecord[]): AbsenceRecord[] => {
  const adjustedRecords = records.map((record) => ({
    ...record,
    from: new Date(record.from),
    till: new Date(record.till),
    requestDate: new Date(record.requestDate),
    regularized: record.regularized ?? false,
    regularizedDelta: record.regularizedDelta ?? 0,
  }));

  const regularizations = regulRecords
    .filter((regul) => regul.expenditureQuantity !== 0)
    .slice()
    .sort((a, b) => normalizeDay(a.dateToRegularise) - normalizeDay(b.dateToRegularise) || a.date.getTime() - b.date.getTime());

  for (const regul of regularizations) {
    const employeeCode = regul.employeeCode.toLowerCase();
    const targetDay = normalizeDay(regul.dateToRegularise);

    const candidates = adjustedRecords
      .filter(
        (record) =>
          record.employeeCode.toLowerCase() === employeeCode &&
          record.type === regul.rowType &&
          record.status === 'Accepted',
      )
      .sort((a, b) => normalizeDay(a.from) - normalizeDay(b.from) || normalizeDay(a.till) - normalizeDay(b.till));

    let targetRecord =
      candidates
        .filter((record) => {
          const recordFrom = normalizeDay(record.from);
          const recordTill = normalizeDay(record.till);
          return targetDay >= recordFrom && targetDay <= recordTill;
        })
        .sort((a, b) => {
          const aSpan = normalizeDay(a.till) - normalizeDay(a.from);
          const bSpan = normalizeDay(b.till) - normalizeDay(b.from);

          if (aSpan !== bSpan) return aSpan - bSpan;

          const aFromDistance = Math.abs(normalizeDay(a.from) - targetDay);
          const bFromDistance = Math.abs(normalizeDay(b.from) - targetDay);

          if (aFromDistance !== bFromDistance) return aFromDistance - bFromDistance;

          return a.requestDate.getTime() - b.requestDate.getTime();
        })[0];

    if (!targetRecord) {
      targetRecord = {
        id: crypto.randomUUID(),
        employeeCode,
        employeeUsername: regul.employeeCode,
        department: undefined,
        type: regul.rowType as AbsenceRecord['type'],
        category: getAbsenceCategory(regul.rowType as AbsenceRecord['type']),
        from: new Date(regul.dateToRegularise),
        till: new Date(regul.dateToRegularise),
        requestDate: new Date(regul.date),
        numberOfDays: 0,
        status: AbsenceStatus.ACCEPTED,
        validationStatus: regul.validationStatus,
        sourceFile: regul.sourceFile,
        regularized: false,
        regularizedDelta: 0,
      };
      adjustedRecords.push(targetRecord);
    }

    const currentFrom = normalizeDay(targetRecord.from);
    if (targetDay < currentFrom) {
      targetRecord.from = new Date(targetDay);
    }

    targetRecord.numberOfDays = Math.max(targetRecord.numberOfDays + regul.expenditureQuantity, 0);
    targetRecord.regularized = true;
    targetRecord.regularizedDelta += regul.expenditureQuantity;
  }

  return adjustedRecords;
};

export function useSharePointData(): UseSharePointDataReturn {
  const { t: tErrors } = useTranslation('errors');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const setRecords = useAppStore((state) => state.setRecords);
  const setRegulRecords = useAppStore((state) => state.setRegulRecords);
  const setVacationStats = useAppStore((state) => state.setVacationStats);
  const setProcessedFileNotes = useAppStore((state) => state.setProcessedFileNotes);
  const setFileErrors = useAppStore((state) => state.setFileErrors);
  const setVacationExceptions = useAppStore((state) => state.setVacationExceptions);
  const setArrivalDates = useAppStore((state) => state.setArrivalDates);

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
      const fileErrors: string[] = [];

      // --- Roster folder: procesa TODOS los ficheros y mergea por Code ---
      // Excel: extrae departamento + arrival date escaneando todas las hojas.
      // JSON: extrae sólo mappings de departamento (legacy).
      // Las filas sin `Arrival date` se ignoran para entitlement; el primer
      // valor encontrado por code prevalece sobre los siguientes.
      const departmentMap = new Map<string, Department>();
      // Departments explicitly set via the `Check` column — applied last to override Primary entity.
      const checkDepartmentMap = new Map<string, Department>();
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
            const { departments, checkDepartments, arrivals } = await loadRosterFile(
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
            // Collect Check-based mappings — applied after all files to ensure they win.
            checkDepartments.forEach((v: Department, k: string) => checkDepartmentMap.set(k, v));
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
        // Apply Check-based overrides — these win over Primary entity regardless of file order.
        checkDepartmentMap.forEach((v, k) => departmentMap.set(k, v));
        console.debug(`[Roster total] ${checkDepartmentMap.size} Check-based overrides applied`);
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
            const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
            rawRecords.push(...parseExcelFile(workbook, file.name));
          }

          processedFileNotes.push(file.name);
          console.debug(`[Absences] ${file.name} -> parseExcelFile/parseSpreadsheetXmlFile + dedup by code|type|from|till`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          fileErrors.push(`${file.name}: ${msg}`);
          console.error('Error parsing absence file', file.name, ':', err);
        }
      }

      if (rawRecords.length === 0) {
        throw new Error(tErrors('noValidAbsenceFiles'));
      }

      const dedupedRecords = deduplicateRecords(rawRecords);
      const enriched = enrichWithDepartment(dedupedRecords, departmentMap);

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
            const msg = err instanceof Error ? err.message : String(err);
            fileErrors.push(`${file.name}: ${msg}`);
            console.error('Error parsing regul file', file.name, ':', err);
          }
        }
      }

      setRegulRecords(regulRecords);
      const adjusted = applyRegularizations(enriched, regulRecords);
      setRecords(adjusted, ausenciasUrl);
      setProcessedFileNotes(processedFileNotes);
      setFileErrors(fileErrors);

      // --- Excepciones vacaciones ---
      const exceptionsMap = new Map<string, number>(); // for computation
      const exceptionsFullRecord: Record<string, { days: number; notes?: string }> = {};
      const exceptionsUrl = appEnv.exceptionsLibraryUrl;

      if (exceptionsUrl) {
        const excFiles = await listFolderFiles(client, siteAbsUrl, siteRelUrl, exceptionsUrl);
        for (const file of excFiles) {
          if (!/exceptions\.xlsx$/i.test(file.name)) continue;
          try {
            const buffer = await fetchFileBuffer(client, siteAbsUrl, file.serverRelativeUrl);
            if (!buffer) continue;
            const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
            for (const exc of parseExceptionsFile(workbook)) {
              const key = `${exc.employeeCode.toLowerCase()}|${exc.year}`;
              exceptionsMap.set(key, exc.days);
              exceptionsFullRecord[key] = { days: exc.days, notes: exc.notes };
            }
            console.debug(`[Exceptions] ${file.name} -> ${exceptionsMap.size} entries`);
          } catch (err) {
            console.error('Error parsing exceptions file', file.name, ':', err);
          }
        }
      }

      setVacationExceptions(exceptionsFullRecord);

      // --- Arrival dates (persisted for post-save recomputation) ---
      const arrivalDatesRecord: Record<string, string> = {};
      arrivalDates.forEach((v, k) => { arrivalDatesRecord[k] = v.toISOString(); });
      setArrivalDates(arrivalDatesRecord);

      // --- Vacation stats ---
      const currentYear = new Date().getFullYear();
      const statsMap = computeVacationStats(adjusted, arrivalDates, currentYear, regulRecords, new Date(), exceptionsMap);
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
  }, [setRecords, setRegulRecords, setVacationStats, setProcessedFileNotes, setFileErrors, setVacationExceptions, setArrivalDates, tErrors]);

  useEffect(() => {
    loadData().catch(() => { /* Error handled by state */ });
  }, [loadData]);

  return { isLoading, error, dataLoaded };
}

// ---------------------------------------------------------------------------
// Helpers: write exceptions.xlsx back to SharePoint
// ---------------------------------------------------------------------------

const EXCEPTIONS_FILE_NAME = 'exceptions.xlsx';
const EXCEPTIONS_HEADERS = ['Employee', 'Year', 'Days', 'Notes'];

/** Downloads the current exceptions.xlsx or returns an empty workbook if it doesn't exist. */
async function fetchOrCreateExceptionsWorkbook(
  client: SPHttpClient,
  siteAbsUrl: string,
  fileServerRelativeUrl: string,
): Promise<XLSX.WorkBook> {
  const url = `${siteAbsUrl}/_api/web/GetFileByServerRelativeUrl('${encodeURIComponent(fileServerRelativeUrl)}')/$value`;
  const response = await client.get(url, SPHttpClient.configurations.v1);
  if (response.ok) {
    const buffer = await response.arrayBuffer();
    return XLSX.read(buffer, { type: 'array', cellDates: false });
  }
  // File doesn't exist yet — create an empty workbook with headers
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([EXCEPTIONS_HEADERS]);
  XLSX.utils.book_append_sheet(wb, ws, 'Exceptions');
  return wb;
}

/** Uploads a workbook as xlsx to a SharePoint file URL (creates or overwrites). */
async function uploadExceptionsWorkbook(
  client: SPHttpClient,
  siteAbsUrl: string,
  folderServerRelativePath: string,
  workbook: XLSX.WorkBook,
): Promise<void> {
  const buf = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as Uint8Array;

  // decodedurl must NOT be percent-encoded — the parameter name already implies a decoded value.
  const uploadUrl = `${siteAbsUrl}/_api/web/GetFolderByServerRelativeUrl('${encodeURIComponent(folderServerRelativePath)}')/Files/AddUsingPath(decodedurl='${EXCEPTIONS_FILE_NAME}',overwrite=true)`;
  const response = await client.post(uploadUrl, SPHttpClient.configurations.v1, {
    headers: { 'Content-Type': 'application/octet-stream' },
    body: new Blob([buf], { type: 'application/octet-stream' }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`Error al guardar exceptions.xlsx: ${text}`);
  }
}

function getExceptionsServerRelativePaths(siteRelUrl: string): { folderPath: string; filePath: string } {
  const excUrl = appEnv.exceptionsLibraryUrl;
  if (!excUrl) {
    throw new Error('Carpeta "Excepciones vacaciones" no configurada en las propiedades del web part.');
  }
  const folderPath = `${siteRelUrl.replace(/\/+$/, '')}/${excUrl.replace(/^\/+/, '')}`;
  const filePath = `${folderPath}/${EXCEPTIONS_FILE_NAME}`;
  return { folderPath, filePath };
}

/**
 * Upserts a row in exceptions.xlsx for the given employee+year.
 * Creates the file if it doesn't exist.
 */
export async function saveVacationException(employeeCode: string, year: number, days: number, notes?: string): Promise<void> {
  const client = getSpHttpClient();
  const siteAbsUrl = getSiteAbsoluteUrl();
  const siteRelUrl = getSiteServerRelativeUrl();
  const { folderPath, filePath } = getExceptionsServerRelativePaths(siteRelUrl);

  const wb = await fetchOrCreateExceptionsWorkbook(client, siteAbsUrl, filePath);
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];

  type Row = { Employee: string; Year: number; Days: number; Notes: string };
  const rows = XLSX.utils.sheet_to_json<Row>(ws, { defval: '' });

  const normalizedCode = employeeCode.toLowerCase();
  const existingIdx = rows.findIndex(
    (r) => String(r.Employee).replace(/-\d+$/, '').toLowerCase() === normalizedCode && Number(r.Year) === year,
  );

  if (existingIdx >= 0) {
    rows[existingIdx] = { Employee: employeeCode, Year: year, Days: days, Notes: notes ?? '' };
  } else {
    rows.push({ Employee: employeeCode, Year: year, Days: days, Notes: notes ?? '' });
  }

  const newWs = XLSX.utils.json_to_sheet(rows, { header: EXCEPTIONS_HEADERS });
  wb.Sheets[sheetName] = newWs;

  await uploadExceptionsWorkbook(client, siteAbsUrl, folderPath, wb);
}

/**
 * Removes the row for the given employee+year from exceptions.xlsx.
 * No-ops if no matching row exists.
 */
export async function deleteVacationException(employeeCode: string, year: number): Promise<void> {
  const client = getSpHttpClient();
  const siteAbsUrl = getSiteAbsoluteUrl();
  const siteRelUrl = getSiteServerRelativeUrl();
  const { folderPath, filePath } = getExceptionsServerRelativePaths(siteRelUrl);

  const wb = await fetchOrCreateExceptionsWorkbook(client, siteAbsUrl, filePath);
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];

  type Row = { Employee: string; Year: number; Days: number };
  const rows = XLSX.utils.sheet_to_json<Row>(ws, { defval: '' });

  const normalizedCode = employeeCode.toLowerCase();
  const filtered = rows.filter(
    (r) => !(String(r.Employee).replace(/-\d+$/, '').toLowerCase() === normalizedCode && Number(r.Year) === year),
  );

  if (filtered.length === rows.length) return; // Nothing to delete

  const newWs = XLSX.utils.json_to_sheet(filtered, { header: EXCEPTIONS_HEADERS });
  wb.Sheets[sheetName] = newWs;

  await uploadExceptionsWorkbook(client, siteAbsUrl, folderPath, wb);
}
