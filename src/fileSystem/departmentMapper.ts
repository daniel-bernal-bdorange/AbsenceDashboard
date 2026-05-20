import * as XLSX from 'xlsx';

import type { Department, EmployeeRosterRow } from '../types';

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

const loadJsonMappings = async (fileHandle: FileSystemFileHandle) => {
  const file = await fileHandle.getFile();
  const raw = (await file.text()).trim();

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

const loadExcelMappings = async (fileHandle: FileSystemFileHandle) => {
  const file = await fileHandle.getFile();
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
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

export async function loadDepartmentMap(dirHandle: FileSystemDirectoryHandle): Promise<Map<string, Department>> {
  const fileHandles: Array<[string, FileSystemFileHandle]> = [];

  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file' && (isExcelFile(entry.name) || isJsonFile(entry.name))) {
      fileHandles.push([entry.name, entry]);
    }
  }

  for (const [fileName, fileHandle] of fileHandles) {
    if (isJsonFile(fileName)) {
      try {
        const map = await loadJsonMappings(fileHandle);

        if (map.size > 0) {
          return map;
        }
      } catch {
        continue;
      }
    }
  }

  for (const [fileName, fileHandle] of fileHandles) {
    if (/employee|category|user/i.test(fileName)) {
      let map: Map<string, Department>;

      try {
        map = await loadExcelMappings(fileHandle);
      } catch {
        continue;
      }

      if (map.size > 0) {
        return map;
      }
    }
  }

  return new Map<string, Department>();
}