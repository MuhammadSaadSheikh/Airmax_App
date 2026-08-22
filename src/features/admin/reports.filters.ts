import type { ReportFilters } from '@/services/api/reports.models';

export type ReportRangePreset = 'current_month' | 'last_90_days' | 'all_time';

const DAY_MS = 86_400_000;

export function reportFiltersForPreset(
  preset: ReportRangePreset,
  now = new Date(),
): ReportFilters {
  const to = now.toISOString();
  let from: string;

  if (preset === 'current_month') {
    from = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    ).toISOString();
  } else if (preset === 'last_90_days') {
    from = new Date(now.getTime() - 89 * DAY_MS).toISOString();
  } else {
    from = '1970-01-01T00:00:00.000Z';
  }

  return { from, to, timezone: 'Asia/Karachi' };
}
