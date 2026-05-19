import { useCallback, useState } from 'react';

import * as XLSX from 'xlsx';

import { parseExcelFile } from '../api/excelParser';
import { useAppStore } from '../store/useAppStore';

import { loadDepartmentMap } from './departmentMapper';

type UseFolderPickerReturn = {
  pickFolder: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  folderName: string | null;
};

const isExcelFile = (fileName: string) => /\.(xlsx|xls)$/i.test(fileName);

export function useFolderPicker(): UseFolderPickerReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [folderName, setFolderName] = useState<string | null>(null);

  const pickFolder = useCallback(async () => {
    if (typeof window.showDirectoryPicker !== 'function') {
      throw new Error('Este navegador no soporta la selección de carpetas. Usa Chrome o Edge.');
    }

    setIsLoading(true);
    setError(null);

    try {
      const dirHandle = await window.showDirectoryPicker({ mode: 'read' });
      const records = [] as ReturnType<typeof parseExcelFile>[number][];
      await loadDepartmentMap(dirHandle);

      for await (const entry of dirHandle.values()) {
        if (entry.kind !== 'file' || !isExcelFile(entry.name)) {
          continue;
        }

        if (/employee-departments\.json$/i.test(entry.name)) {
          continue;
        }

        const file = await entry.getFile();
        const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });

        try {
          records.push(...parseExcelFile(workbook, entry.name));
        } catch {
          continue;
        }
      }

      if (records.length === 0) {
        throw new Error('No se encontraron ficheros Excel validos en la carpeta.');
      }

      useAppStore.getState().setRecords(records, dirHandle.name);
      setFolderName(dirHandle.name);
    } catch (error_) {
      const message = error_ instanceof Error ? error_.message : 'No se pudo leer la carpeta seleccionada.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { pickFolder, isLoading, error, folderName };
}