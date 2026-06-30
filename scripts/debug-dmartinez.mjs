/**
 * Debug script: inspects all absence records for a given employee code
 * and simulates both VacationStatsTable (requestedY) and EmployeeSummaryTable
 * (expanded daily records) to find the root cause of anomalous totals.
 *
 * Usage:
 *   node scripts/debug-dmartinez.mjs [employeeCode] [year]
 *   node scripts/debug-dmartinez.mjs dmartinez 2026
 *
 * Pass --inventory to instead print row counts per file (no employee filter).
 */

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const INVENTORY_MODE = process.argv.includes('--inventory');
const TARGET_CODE = (process.argv[2] ?? 'dmartinez').toLowerCase();
const TARGET_YEAR = parseInt(process.argv[3] ?? '2026', 10);

// ---------------------------------------------------------------------------
// Inventory mode: print row counts per file, then exit
// ---------------------------------------------------------------------------
if (INVENTORY_MODE) {
  const { readdir: rd2, readFile: rf2 } = await import('node:fs/promises');
  const AUSENCIAS_DIR = join(ROOT, 'datos ausencias', 'Data', 'Ausencias');
  const allFiles = (await rd2(AUSENCIAS_DIR)).filter(f => /\.(xlsx|xls)$/i.test(f));
  // Also scan for initial-dot codes across all files
  const allDotCodes = new Set();
  for (const f of allFiles) {
    try {
      const buf = await rf2(join(AUSENCIAS_DIR, f));
      const wb = XLSX.read(buf, { type: 'array', cellDates: true });
      const sheetName = wb.SheetNames.find(n => ['Export ASA','SX'].includes(n)) ?? wb.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
      const clean = TARGET_CODE.replace('--inventory','').trim();
      const byCode = rows.filter(r => String(r['Code']??'').replace(/-\d+$/,'').toLowerCase() === clean);
      const byEmp  = rows.filter(r => String(r['Employee']??'').toLowerCase().includes(clean));
      const extra  = byEmp.filter(r => String(r['Code']??'').replace(/-\d+$/,'').toLowerCase() !== clean);
      console.log(`\n${f}  total=${rows.length}  byCode=${byCode.length}  byEmp=${byEmp.length}  extraByEmpOnly=${extra.length}`);
      if (extra.length > 0) {
        console.log('  EXTRA rows (Employee matches but Code does not):');
        extra.forEach(r => {
          const from = r['From'] instanceof Date ? r['From'].toISOString().slice(0,10) : String(r['From']??'');
          const till = r['Till'] instanceof Date ? r['Till'].toISOString().slice(0,10) : String(r['Till']??'');
          console.log(`    Code="${r['Code']}"  Emp="${r['Employee']}"  Type="${r['Type']}"  From=${from}  Till=${till}  Days=${r['Number of days']}  Status=${r['Status']}`);
        });
      }
      // Collect all initial-dot codes
      rows.forEach(r => {
        const normalized = String(r['Code']??'').replace(/-\d+$/,'').toLowerCase();
        if (/^[a-z]\.[a-z]/.test(normalized)) allDotCodes.add(normalized);
      });
    } catch(e) { console.log(`${f}: ERROR ${e.message}`); }
  }
  console.log(`\n[INITIAL-DOT CODES across all files]: ${allDotCodes.size > 0 ? [...allDotCodes].sort().join(', ') : '(none)'}`);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Parsing helpers (mirrors excelParser.ts)
// ---------------------------------------------------------------------------

const SHEET_NAMES = ['Export ASA', 'SX'];

const normalizeEmployeeCode = (raw) =>
  String(raw ?? '').trim()
    .replace(/-\d+$/, '')           // strip Everwin absence counter: dmartinez-026 → dmartinez
    .replace(/^([a-zA-Z])\./, '$1'); // strip historical initial-dot:  d.martinez → dmartinez

const normalizeAbsenceType = (text) => {
  const lower = text.toLowerCase();
  if (lower.includes('vacacion') && lower.includes('anterior')) return 'Vacaciones a�o anterior';
  if (lower.includes('vacacion')) return 'Vacaciones';
  if (lower.includes('maternidad') || lower.includes('paternidad')) return 'Maternidad/Paternidad';
  if (lower.includes('enfermedad') || lower.includes('operacion') || lower.includes('baja')) return 'Enfermedad';
  return text;
};

const normalizeStatus = (raw) => {
  const s = String(raw ?? '').trim();
  if (s === 'Cancelled') return 'Canceled';
  if (s === 'In progress') return 'Running';
  return s;
};

const INACTIVE_STATUSES = new Set(['Refused', 'Canceled', 'Cancellation']);

const parseBoundaryDate = (value) => {
  if (value instanceof Date) {
    const d = new Date(value);
    d.setHours(23, 59, 0, 0);
    return d;
  }
  const text = String(value ?? '').trim();
  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]), 23, 59, 0, 0);
  }
  const match = text.match(/^([0-3]\d)\/([0-1]\d)\/(\d{4})\s+(Morning|Noon|End of the day|Evening)$/);
  if (!match) return null;
  const [, day, month, year, boundary] = match;
  const hours = boundary === 'Morning' ? 0 : boundary === 'Noon' ? 12 : 23;
  const mins = boundary === 'Morning' ? 0 : boundary === 'Noon' ? 0 : 59;
  return new Date(Number(year), Number(month) - 1, Number(day), hours, mins, 0, 0);
};

const toLocalDateStr = (d) => {
  if (!d) return 'N/A';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;

const parseRowsFromSheet = (rows, sourceFile) => {
  const records = [];
  for (const row of rows) {
    const rawCode = String(row['Code'] ?? '').trim();
    if (!rawCode || rawCode.toLowerCase().startsWith('total') || rawCode.toLowerCase().includes('suma')) continue;
    const typeRaw = String(row['Type'] ?? '').trim();
    if (!typeRaw || typeRaw.toLowerCase() === 'total') continue;

    const code = normalizeEmployeeCode(rawCode).toLowerCase();
    if (code !== TARGET_CODE) continue;

    const type = normalizeAbsenceType(typeRaw);
    const from = parseBoundaryDate(row['From']);
    const till = parseBoundaryDate(row['Till']);
    const rawDays = row['Number of days'];
    const numberOfDays = typeof rawDays === 'number' ? rawDays : parseFloat(String(rawDays ?? '').replace(',', '.'));
    const status = normalizeStatus(row['Status']);
    const reqVal = row['Request date'];
    const requestDate = reqVal instanceof Date ? reqVal : new Date(String(reqVal ?? ''));
    const employee = String(row['Employee'] ?? '').trim();

    records.push({ rawCode, code, employee, type, from, till, numberOfDays, status, requestDate, sourceFile });
  }
  return records;
};

const parseAbsenceFile = (buffer, sourceFile) => {
  try {
    const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
    const sheetName = SHEET_NAMES.find((n) => wb.Sheets[n]);
    if (!sheetName) {
      console.warn(`  ? No sheet ${SHEET_NAMES.join('/')} in ${sourceFile}`);
      return [];
    }
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
    return parseRowsFromSheet(rows, sourceFile);
  } catch (err) {
    console.warn(`  ? Error parsing ${sourceFile}: ${err.message}`);
    return [];
  }
};

// ---------------------------------------------------------------------------
// Dedup (mirrors deduplicateRecords.ts)
// ---------------------------------------------------------------------------

const toKey = (r) => `${r.code}|${r.type}|${toLocalDateStr(r.from)}|${toLocalDateStr(r.till)}`;

const deduplicateRecords = (records) => {
  const best = new Map();
  for (const r of records) {
    const key = toKey(r);
    const existing = best.get(key);
    if (!existing || r.requestDate > existing.requestDate) best.set(key, r);
  }
  return Array.from(best.values());
};

// ---------------------------------------------------------------------------
// Expand to daily records (mirrors absenceExpander.ts)
// This is what EmployeeSummaryTable consumes
// ---------------------------------------------------------------------------

const expandToDailyRecords = (record) => {
  const normalizeDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const from = normalizeDay(record.from);
  const till = normalizeDay(record.till);
  const results = [];

  if (record.numberOfDays < 1) {
    if (!isWeekend(from)) results.push({ date: from, isFullDay: false, record });
    return results;
  }

  const cur = new Date(from);
  while (cur <= till) {
    if (!isWeekend(cur)) results.push({ date: new Date(cur), isFullDay: true, record });
    cur.setDate(cur.getDate() + 1);
  }
  return results;
};

// ---------------------------------------------------------------------------
// Regul parsing
// ---------------------------------------------------------------------------

const parseRegulFile = (buffer, sourceFile) => {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName = SHEET_NAMES.find((n) => wb.Sheets[n]);
  if (!sheetName) return [];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
  return rows
    .filter((row) => normalizeEmployeeCode(row['Employee']).toLowerCase() === TARGET_CODE)
    .map((row) => ({
      code: normalizeEmployeeCode(row['Employee']).toLowerCase(),
      rowType: normalizeAbsenceType(String(row['Row type'] ?? '')),
      expenditureQuantity: typeof row['Expenditure quantity'] === 'number'
        ? row['Expenditure quantity']
        : parseFloat(String(row['Expenditure quantity'] ?? '').replace(',', '.')),
      dateToRegularise: row['Date to regularise'] instanceof Date
        ? row['Date to regularise']
        : new Date(String(row['Date to regularise'] ?? '')),
      title: String(row['Title'] ?? ''),
      sourceFile,
    }));
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const AUSENCIAS_DIR = join(ROOT, 'datos ausencias', 'Data', 'Ausencias');
const REGUL_DIR = join(ROOT, 'datos ausencias', 'Data', 'Regularizaciones');

console.log(`\n${'='.repeat(70)}`);
console.log(`DEBUG: employee="${TARGET_CODE}"  year=${TARGET_YEAR}`);
console.log('='.repeat(70));

// --- Load all absence files ---
const ausenciaFiles = (await readdir(AUSENCIAS_DIR)).filter((f) => /\.(xlsx|xls)$/i.test(f));
console.log(`\n[Ausencias] ${ausenciaFiles.length} files: ${ausenciaFiles.join(', ')}`);

const allRaw = [];
for (const fname of ausenciaFiles) {
  const buffer = await readFile(join(AUSENCIAS_DIR, fname));
  const records = parseAbsenceFile(buffer, fname);
  if (records.length > 0) console.log(`  ${fname}: ${records.length} rows`);
  allRaw.push(...records);
}

console.log(`\n[RAW] Total rows for ${TARGET_CODE}: ${allRaw.length}`);
if (allRaw.length > 0) {
  console.log('\n  rawCode              | type                     | from       | till       | days   | status    | requestDate | file');
  console.log('  ' + '-'.repeat(125));
  for (const r of allRaw) {
    console.log(
      `  ${r.rawCode.padEnd(20)} | ${r.type.padEnd(24)} | ${toLocalDateStr(r.from).padEnd(10)} | ${toLocalDateStr(r.till).padEnd(10)} | ${String(r.numberOfDays).padStart(6)} | ${r.status.padEnd(9)} | ${toLocalDateStr(r.requestDate)} | ${r.sourceFile}`
    );
  }
}

// --- Dedup ---
const deduped = deduplicateRecords(allRaw);
const discarded = allRaw.length - deduped.length;
console.log(`\n[DEDUP] ${deduped.length} survive, ${discarded} discarded`);
if (discarded > 0) {
  const best = new Map();
  for (const r of allRaw) {
    const key = toKey(r);
    const existing = best.get(key);
    if (!existing || r.requestDate > existing.requestDate) best.set(key, r);
  }
  const survivors = new Set(best.values());
  const droppedRecords = allRaw.filter((r) => !survivors.has(r));
  console.log('  DISCARDED:');
  for (const r of droppedRecords) {
    console.log(`    ? ${r.rawCode} | ${r.type} | ${toLocalDateStr(r.from)}?${toLocalDateStr(r.till)} | ${r.numberOfDays}d | ${r.status} | ${r.sourceFile}`);
  }
}

console.log(`\n[SURVIVING RECORDS] all types/years:`);
for (const r of deduped) {
  console.log(`  ${r.rawCode.padEnd(20)} | ${r.type.padEnd(30)} | ${toLocalDateStr(r.from)}?${toLocalDateStr(r.till)} | ${r.numberOfDays}d | ${r.status}`);
}

// ---------------------------------------------------------------------------
// VacationStatsTable: requestedY = sum numberOfDays for Vacaciones in TARGET_YEAR
// ---------------------------------------------------------------------------
const isActive = (s) => !INACTIVE_STATUSES.has(s);

const vacActiveYear = deduped.filter(
  (r) => r.type === 'Vacaciones' && isActive(r.status) && r.from?.getFullYear() === TARGET_YEAR
);
const requestedY = vacActiveYear.reduce((s, r) => s + r.numberOfDays, 0);

console.log(`\n[VacationStatsTable] requestedY (${TARGET_YEAR}) = ${requestedY}`);
for (const r of vacActiveYear) {
  console.log(`  + ${toLocalDateStr(r.from)}?${toLocalDateStr(r.till)}  days=${r.numberOfDays}  status=${r.status}`);
}

// ---------------------------------------------------------------------------
// EmployeeSummaryTable: expand ? filter by year + Accepted ? sum daily values
// ---------------------------------------------------------------------------
const VACATION_CATEGORIES = new Set(['Vacaciones', 'Vacaciones a�o anterior']);

const allDayRecords = deduped.flatMap(expandToDailyRecords);
const dayRecordsYearAccepted = allDayRecords.filter(
  (dr) => dr.date.getFullYear() === TARGET_YEAR && dr.record.status === 'Accepted'
);

// --- No-year-filter totals (all years) ---
const allAccepted = allDayRecords.filter((dr) => dr.record.status === 'Accepted');
const totalDaysAllYears = allAccepted.reduce((s, dr) => s + (dr.isFullDay ? 1 : 0.5), 0);
const yearBreakdown = new Map();
for (const dr of allAccepted) {
  const yr = dr.date.getFullYear();
  yearBreakdown.set(yr, (yearBreakdown.get(yr) ?? 0) + (dr.isFullDay ? 1 : 0.5));
}
console.log(`\n[NO YEAR FILTER] totalDays all years = ${totalDaysAllYears}`);
for (const [yr, days] of [...yearBreakdown.entries()].sort()) {
  console.log(`  ${yr}: ${days} days`);
}

const vacDays = dayRecordsYearAccepted
  .filter((dr) => dr.record.type === 'Vacaciones')
  .reduce((s, dr) => s + (dr.isFullDay ? 1 : 0.5), 0);

const vacPrevDays = dayRecordsYearAccepted
  .filter((dr) => dr.record.type === 'Vacaciones a�o anterior')
  .reduce((s, dr) => s + (dr.isFullDay ? 1 : 0.5), 0);

const totalDays = dayRecordsYearAccepted.reduce((s, dr) => s + (dr.isFullDay ? 1 : 0.5), 0);

console.log(`\n[EmployeeSummaryTable] year=${TARGET_YEAR}, Accepted only:`);
console.log(`  vacationDays         = ${vacDays}`);
console.log(`  vacationPrevYearDays = ${vacPrevDays}`);
console.log(`  totalDays            = ${totalDays}`);

// Per-record breakdown for vacation categories
console.log(`\n  Vacation breakdown (daily expansion):`);
const vacByRecord = new Map();
for (const dr of dayRecordsYearAccepted.filter((dr) => VACATION_CATEGORIES.has(dr.record.type))) {
  const key = `${dr.record.rawCode}|${toLocalDateStr(dr.record.from)}?${toLocalDateStr(dr.record.till)}|${dr.record.type}`;
  const entry = vacByRecord.get(key) ?? { days: 0, record: dr.record };
  entry.days += dr.isFullDay ? 1 : 0.5;
  vacByRecord.set(key, entry);
}
if (vacByRecord.size === 0) {
  console.log('  (none)');
} else {
  for (const [key, { days, record }] of vacByRecord) {
    console.log(`  + ${key}  expanded=${days}  (record.numberOfDays=${record.numberOfDays})  file=${record.sourceFile}`);
  }
}

// --- Regularizations ---
const regulFiles = (await readdir(REGUL_DIR)).filter((f) => /\.(xlsx|xls)$/i.test(f));
console.log(`\n[Regularizaciones] ${regulFiles.length} files`);
const regulRecords = [];
for (const fname of regulFiles) {
  const records = parseRegulFile(await readFile(join(REGUL_DIR, fname)), fname);
  if (records.length > 0) {
    console.log(`  ${fname}: ${records.length} rows`);
    for (const r of records) {
      console.log(`    ${r.rowType.padEnd(30)} | dateToRegularise=${toLocalDateStr(r.dateToRegularise)} | expenditure=${r.expenditureQuantity} | title=${r.title}`);
    }
  }
  regulRecords.push(...records);
}
if (regulRecords.length === 0) console.log(`  (none for ${TARGET_CODE})`);

console.log(`\n${'='.repeat(70)}\n`);
