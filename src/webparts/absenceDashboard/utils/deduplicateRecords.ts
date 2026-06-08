import type { AbsenceRecord } from '../types';

const toKey = (r: AbsenceRecord): string =>
  `${r.employeeCode}|${r.type}|${r.from.toISOString().slice(0, 10)}|${r.till.toISOString().slice(0, 10)}`;

/**
 * Deduplicates absence records from multiple exports.
 * When two records share the same key (code|type|from|till),
 * the one with the more recent requestDate wins.
 */
export function deduplicateRecords(records: AbsenceRecord[]): AbsenceRecord[] {
  const best = new Map<string, AbsenceRecord>();

  for (const record of records) {
    const key = toKey(record);
    const existing = best.get(key);

    if (!existing || record.requestDate > existing.requestDate) {
      best.set(key, record);
    }
  }

  return Array.from(best.values());
}
