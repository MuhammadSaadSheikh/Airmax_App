import type {
  ReportDateRange,
  ReportFilters,
  ReportMetadata,
} from './reports.models';

export type ReportingClock = {
  now(): string;
};

export const systemReportingClock: ReportingClock = {
  now: () => new Date().toISOString(),
};

export function createFixedReportingClock(timestamp: string): ReportingClock {
  const parsed = Date.parse(timestamp);
  if (!Number.isFinite(parsed)) throw new Error('Invalid reporting timestamp');
  return { now: () => timestamp };
}

function validTimestamp(value: string | undefined): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

export function resolveReportDateRange(
  filters: ReportFilters,
  clock: ReportingClock,
): ReportDateRange {
  const now = clock.now();
  if (!validTimestamp(now)) throw new Error('Invalid reporting clock value');
  const nowTimestamp = Date.parse(now);
  const nowDate = new Date(nowTimestamp);
  const defaultFrom = new Date(
    Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth(), 1),
  ).toISOString();
  const from = validTimestamp(filters.from) ? filters.from : defaultFrom;
  const to = validTimestamp(filters.to) ? filters.to : now;
  if (Date.parse(from) > Date.parse(to)) {
    throw new Error('Report start date must not be after end date');
  }
  return { from, to };
}

export function createReportMetadata(
  filters: ReportFilters,
  clock: ReportingClock,
  source: ReportMetadata['source'],
): ReportMetadata {
  const generatedAt = clock.now();
  const range = resolveReportDateRange(filters, { now: () => generatedAt });
  return {
    ...range,
    timezone: filters.timezone?.trim() || 'Asia/Karachi',
    currency: 'PKR',
    generatedAt,
    asOf: generatedAt,
    source,
  };
}
