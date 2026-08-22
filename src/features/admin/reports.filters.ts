import type { ReportFilters } from '@/services/api/reports.models';
import {
  DEFAULT_REPORTING_TIMEZONE,
  reportingPresetRange,
  resolveTimezoneAwareRange,
} from '@/services/api/reporting.timezone';

export type ReportRangePreset =
  'current_month' | 'last_90_days' | 'all_time' | 'custom';

export function reportFiltersForPreset(
  preset: ReportRangePreset,
  now = new Date(),
  customRange?: { from: string; to: string },
): ReportFilters {
  const timezone = DEFAULT_REPORTING_TIMEZONE;
  if (preset === 'custom') {
    if (!customRange) throw new Error('Custom report range is required');
    return {
      ...resolveTimezoneAwareRange(
        { ...customRange, timezone },
        now.toISOString(),
      ),
      timezone,
    };
  }
  return {
    ...reportingPresetRange(preset, now.toISOString(), timezone),
    timezone,
  };
}
