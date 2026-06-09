import { useState, useMemo } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { useAppStore } from '../../store/useAppStore';

export function EmployeeFilter() {
  const { t } = useTranslation('filters');
  const { records, filters, setFilters } = useAppStore();
  const [search, setSearch] = useState('');

  const employees = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of records) {
      if (!seen.has(r.employeeUsername)) {
        seen.set(r.employeeUsername, r.employeeUsername);
      }
    }
    return Array.from(seen.values()).sort();
  }, [records]);

  const filtered = useMemo(
    () =>
      employees.filter((e) =>
        e.toLowerCase().includes(search.toLowerCase()),
      ),
    [employees, search],
  );

  const handleToggle = (emp: string) => {
    const next = filters.employees.includes(emp)
      ? filters.employees.filter((e) => e !== emp)
      : [...filters.employees, emp];
    setFilters({ employees: next });
  };

  return (
    <div className="relative">
      <input
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:border-orangeBusiness focus:outline-none"
        placeholder={t('searchEmployees')}
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {search && filtered.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {filtered.slice(0, 20).map((emp) => (
            <li key={emp}>
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                type="button"
                onClick={() => {
                  handleToggle(emp);
                  setSearch('');
                }}
              >
                <span
                  className={`h-4 w-4 rounded border ${
                    filters.employees.includes(emp)
                      ? 'bg-orangeBusiness border-orangeBusiness'
                      : 'border-gray-300'
                  } flex items-center justify-center`}
                >
                  {filters.employees.includes(emp) && (
                    <span className="text-white text-xs">✓</span>
                  )}
                </span>
                {emp}
              </button>
            </li>
          ))}
        </ul>
      )}
      {filters.employees.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {filters.employees.map((emp) => (
            <span
              key={emp}
              className="inline-flex items-center gap-1 rounded-full bg-orangeBusiness-pale px-2 py-0.5 text-xs text-orangeBusiness"
            >
              {emp}
              <button
                className="hover:text-orangeBusiness-dark"
                onClick={() => handleToggle(emp)}
                type="button"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}