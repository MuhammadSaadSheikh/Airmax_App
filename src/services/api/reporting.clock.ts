import type {
  ReportDateRange,
  ReportFilters,
  ReportMetadata,
} from './reports.models';
import {
  normalizeReportingTimezone,
  resolveTimezoneAwareRange,
} from './reporting.timezone';

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

export function resolveReportDateRange(
  filters: ReportFilters,
  clock: ReportingClock,
): ReportDateRange {
  return resolveTimezoneAwareRange(filters, clock.now());
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
    timezone: normalizeReportingTimezone(filters.timezone),
    currency: 'PKR',
    generatedAt,
    asOf: generatedAt,
    source,
  };
}
