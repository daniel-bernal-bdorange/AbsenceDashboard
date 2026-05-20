import { useAppStore } from '../../store/useAppStore';

export function DateRangeFilter() {
  const { filters, setFilters } = useAppStore();

  return (
    <div className="flex flex-col gap-1.5">
      <input
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 placeholder-gray-400 focus:border-orangeBusiness focus:outline-none"
        placeholder="Desde"
        type="date"
        value={
          filters.dateRange.from
            ? filters.dateRange.from.toISOString().split('T')[0]
            : ''
        }
        onChange={(e) => {
          const dateStr = e.target.value;
          setFilters({
            dateRange: {
              ...filters.dateRange,
              from: dateStr ? new Date(dateStr + 'T12:00:00') : null,
            },
            selectedMonth: null,
          });
        }}
      />
      <input
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 placeholder-gray-400 focus:border-orangeBusiness focus:outline-none"
        placeholder="Hasta"
        type="date"
        value={
          filters.dateRange.to
            ? filters.dateRange.to.toISOString().split('T')[0]
            : ''
        }
        onChange={(e) => {
          const dateStr = e.target.value;
          setFilters({
            dateRange: {
              ...filters.dateRange,
              to: dateStr ? new Date(dateStr + 'T12:00:00') : null,
            },
            selectedMonth: null,
          });
        }}
      />
    </div>
  );
}