import { useCallback, useState } from 'react';

import * as XLSX from 'xlsx';

import { parseExcelFile, parseSpreadsheetXmlFile } from '../api/excelParser';
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
    setIsLoading(true);
    setError(null);

    try {
      if (typeof window.showDirectoryPicker !== 'function') {
        throw new Error('Tu navegador no soporta la API de selección de carpetas. Usa Chrome, Edge u Opera.');
      }

      if (!window.isSecureContext) {
        throw new Error('La aplicación debe ejecutarse en un contexto seguro (HTTPS o localhost).');
      }

      const dirHandle = await window.showDirectoryPicker({ mode: 'read' });
      const records = [] as ReturnType<typeof parseExcelFile>;
      await loadDepartmentMap(dirHandle);

      for await (const entry of dirHandle.values()) {
        if (entry.kind !== 'file' || !isExcelFile(entry.name)) {
          continue;
        }

        if (/employee-departments\.json$/i.test(entry.name)) {
          continue;
        }

        if (/employee|user|category|roster/i.test(entry.name)) {
          continue;
        }

        try {
          const file = await entry.getFile();
          const arrayBuffer = await file.arrayBuffer();
          const uint8 = new Uint8Array(arrayBuffer);
          const firstByte = uint8[0];

          if (firstByte === 0x3C) {
            const text = new TextDecoder('utf-8').decode(arrayBuffer);
            console.log('Trying XML parse for', entry.name);
            const parsedRecords = parseSpreadsheetXmlFile(text, entry.name);
            console.log('Parsed', parsedRecords.length, 'records from', entry.name);
            records.push(...parsedRecords);
          } else {
            let workbook: XLSX.WorkBook;

            if (entry.name.toLowerCase().endsWith('.xls')) {
              const binaryString = Array.from(uint8).map((b) => String.fromCharCode(b)).join('');
              workbook = XLSX.read(binaryString, { type: 'binary', codepage: 65001 });
            } else {
              workbook = XLSX.read(arrayBuffer, { type: 'array' });
            }

            console.log('Sheets in', entry.name, ':', workbook.SheetNames);
            const parsedRecords = parseExcelFile(workbook, entry.name);
            records.push(...parsedRecords);
          }
        } catch (err) {
          console.error('Error parsing', entry.name, ':', err);
          continue;
        }
      }

      if (records.length === 0) {
        throw new Error('No se encontraron ficheros Excel validos en la carpeta.');
      }

      useAppStore.getState().setRecords(records, dirHandle.name);
      setFolderName(dirHandle.name);
    } catch (error_) {
      if (error_ instanceof DOMException && error_.name === 'AbortError') {
        return;
      }

      const message = error_ instanceof Error ? error_.message : 'Error desconocido';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { pickFolder, isLoading, error, folderName };
}