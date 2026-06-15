import type { AbsenceRecord } from '../types';

// Use local date to avoid UTC offset shifting the date to the previous day
// when a Morning boundary is parsed as 00:00 local time.
const toLocalDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const toKey = (r: AbsenceRecord): string =>
  `${r.employeeCode}|${r.type}|${toLocalDate(r.from)}|${toLocalDate(r.till)}`;

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
