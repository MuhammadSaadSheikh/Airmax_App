import { useMemo, useState } from 'react';
import {
  reportFiltersForPreset,
  type ReportRangePreset,
} from '@/features/admin/reports.filters';
import { formatReportingDate } from '@/services/api/reporting.timezone';

export function useReportFilters() {
  const [now] = useState(() => new Date());
  const initial = useMemo(
    () => reportFiltersForPreset('current_month', now),
    [now],
  );
  const [preset, setPreset] = useState<ReportRangePreset>('current_month');
  const [dateFilters, setDateFilters] = useState(initial);
  const [customFrom, setCustomFrom] = useState(() =>
    formatReportingDate(initial.from!, initial.timezone!),
  );
  const [customTo, setCustomTo] = useState(() =>
    formatReportingDate(initial.to!, initial.timezone!),
  );
  const [customError, setCustomError] = useState<string>();

  const selectPreset = (next: ReportRangePreset) => {
    setPreset(next);
    setCustomError(undefined);
    if (next !== 'custom') setDateFilters(reportFiltersForPreset(next, now));
  };

  const applyCustomRange = () => {
    try {
      setDateFilters(
        reportFiltersForPreset('custom', now, {
          from: customFrom,
          to: customTo,
        }),
      );
      setPreset('custom');
      setCustomError(undefined);
    } catch (error) {
      setCustomError(
        error instanceof Error ? error.message : 'Invalid custom date range',
      );
    }
  };

  return {
    dateFilters,
    filterBarProps: {
      value: preset,
      onChange: selectPreset,
      customFrom,
      customTo,
      customError,
      onCustomFromChange: setCustomFrom,
      onCustomToChange: setCustomTo,
      onApplyCustom: applyCustomRange,
    },
  };
}
