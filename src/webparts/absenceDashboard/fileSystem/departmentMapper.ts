import { SPHttpClient } from '@microsoft/sp-http';
import * as XLSX from 'xlsx';

import type { Department, EmployeeRosterRow, FocusRosterRow } from '../types';

type JsonDepartmentMapping = {
  mappings?: Array<{ username?: string; department?: Department | string }>;
};

const isExcelFile = (fileName: string) => /\.(xlsx|xls)$/i.test(fileName);
const isJsonFile = (fileName: string) => /\.json$/i.test(fileName);

const toText = (value: unknown) => String(value ?? '').trim();

const normalizeDepartment = (value: unknown): Department | null => {
  const text = toText(value).toLowerCase();

  if (text.includes('spain prod') || text.includes('spainprod')) {
    return 'Prod';
  }

  if (text.includes('spain bo') || text.includes('spainbo') || text.includes('back office')) {
    return 'BackOffice';
  }

  if (text === 'prod' || text === 'production') {
    return 'Prod';
  }

  if (text === 'backoffice' || text === 'back office') {
    return 'BackOffice';
  }

  return null;
};

const isUsernameLike = (value: string) => /^[a-z][a-z0-9._-]+$/i.test(value);

const addMapping = (map: Map<string, Department>, username: string, department: Department | null) => {
  if (!username || !department) {
    return;
  }

  map.set(username.toLowerCase(), department);
};

const loadJsonMappings = (jsonText: string): Map<string, Department> => {
  const raw = jsonText.trim();

  if (!raw) {
    return new Map<string, Department>();
  }

  const data = JSON.parse(raw) as JsonDepartmentMapping;
  const map = new Map<string, Department>();

  for (const item of data.mappings ?? []) {
    addMapping(map, toText(item.username), normalizeDepartment(item.department));
  }

  return map;
};

const loadExcelMappings = (buffer: ArrayBuffer): Map<string, Department> => {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const map = new Map<string, Department>();
  const worksheet = workbook.Sheets['Export ASA'] ?? workbook.Sheets[workbook.SheetNames[0]];

  if (!worksheet) {
    return map;
  }

  const rows = XLSX.utils.sheet_to_json<EmployeeRosterRow>(worksheet, {
    defval: '',
  });

  for (const row of rows) {
    const usernameValue = toText(row.Code);
    const primaryEntity = toText(row['Primary entity']);
    const checkEntity = toText(row.Check);
    const departmentValue = normalizeDepartment(checkEntity) ?? normalizeDepartment(primaryEntity);

    if (usernameValue && isUsernameLike(usernameValue)) {
      addMapping(map, usernameValue, departmentValue);
    }
  }

  return map;
};

export async function loadDepartmentMap(
  client: SPHttpClient,
  siteUrl: string,
  fileServerRelativeUrl: string,
): Promise<Map<string, Department>> {
  if (isJsonFile(fileServerRelativeUrl)) {
    try {
      const response = await client.get(
        `${siteUrl}/_api/web/GetFileByServerRelativeUrl('${encodeURIComponent(fileServerRelativeUrl)}')/$value`,
        SPHttpClient.configurations.v1,
      );

      if (!response.ok) {
        return new Map<string, Department>();
      }

      const text = await response.text();
      return loadJsonMappings(text);
    } catch {
      return new Map<string, Department>();
    }
  }

  if (isExcelFile(fileServerRelativeUrl)) {
    try {
      const response = await client.get(
        `${siteUrl}/_api/web/GetFileByServerRelativeUrl('${encodeURIComponent(fileServerRelativeUrl)}')/$value`,
        SPHttpClient.configurations.v1,
      );

      if (!response.ok) {
        return new Map<string, Department>();
      }

      const buffer = await response.arrayBuffer();
      return loadExcelMappings(buffer);
    } catch {
      return new Map<string, Department>();
    }
  }

  return new Map<string, Department>();
}

const loadFocusRosterFromBuffer = (buffer: ArrayBuffer): Map<string, Date> => {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const worksheet = workbook.Sheets['SX'] ?? workbook.Sheets[workbook.SheetNames[0]];
  const map = new Map<string, Date>();

  if (!worksheet) {
    return map;
  }

  const rows = XLSX.utils.sheet_to_json<FocusRosterRow>(worksheet, { defval: '' });

  for (const row of rows) {
    const code = toText(row.Code);

    if (!code || !isUsernameLike(code)) {
      continue;
    }

    const raw = row['Arrival date'];
    const date = raw instanceof Date ? raw : raw ? new Date(String(raw)) : null;

    if (date && !isNaN(date.getTime())) {
      map.set(code.toLowerCase(), date);
    }
  }

  return map;
};

export async function loadFocusRoster(
  client: SPHttpClient,
  siteUrl: string,
  fileServerRelativeUrl: string,
): Promise<Map<string, Date>> {
  if (!isExcelFile(fileServerRelativeUrl)) {
    return new Map<string, Date>();
  }

  try {
    const response = await client.get(
      `${siteUrl}/_api/web/GetFileByServerRelativeUrl('${encodeURIComponent(fileServerRelativeUrl)}')/$value`,
      SPHttpClient.configurations.v1,
    );

    if (!response.ok) {
      return new Map<string, Date>();
    }

    const buffer = await response.arrayBuffer();
    return loadFocusRosterFromBuffer(buffer);
  } catch {
    return new Map<string, Date>();
  }
}
