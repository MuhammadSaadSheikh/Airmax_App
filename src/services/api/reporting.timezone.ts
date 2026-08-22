import type { ReportDateRange, ReportFilters } from './reports.models';

export const DEFAULT_REPORTING_TIMEZONE = 'Asia/Karachi';

type LocalDateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function validTimestamp(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

export function normalizeReportingTimezone(timezone?: string): string {
  const value = timezone?.trim() || DEFAULT_REPORTING_TIMEZONE;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format(0);
  } catch {
    throw new Error(`Invalid reporting timezone: ${value}`);
  }
  return value;
}

function zonedParts(
  timestamp: string | number,
  timezone: string,
): LocalDateParts {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(timestamp));
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find(part => part.type === type)?.value);
  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour: value('hour'),
    minute: value('minute'),
    second: value('second'),
  };
}

function offsetAt(timestamp: number, timezone: string): number {
  const parts = zonedParts(timestamp, timezone);
  const representedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return representedAsUtc - Math.floor(timestamp / 1000) * 1000;
}

function localDateTimeToIso(parts: LocalDateParts, timezone: string): string {
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  let timestamp = localAsUtc - offsetAt(localAsUtc, timezone);
  timestamp = localAsUtc - offsetAt(timestamp, timezone);
  return new Date(timestamp).toISOString();
}

function parseCalendarDate(
  value: string,
): Pick<LocalDateParts, 'year' | 'month' | 'day'> {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error('Custom report dates must use YYYY-MM-DD');
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    throw new Error('Invalid custom report date');
  }
  return { year, month, day };
}

export function startOfReportingDay(value: string, timezone: string): string {
  const zone = normalizeReportingTimezone(timezone);
  return localDateTimeToIso(
    { ...parseCalendarDate(value), hour: 0, minute: 0, second: 0 },
    zone,
  );
}

export function endOfReportingDay(value: string, timezone: string): string {
  const zone = normalizeReportingTimezone(timezone);
  const local = parseCalendarDate(value);
  const next = new Date(Date.UTC(local.year, local.month - 1, local.day + 1));
  const nextDate = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-${String(next.getUTCDate()).padStart(2, '0')}`;
  return new Date(
    Date.parse(startOfReportingDay(nextDate, zone)) - 1,
  ).toISOString();
}

export function formatReportingDate(
  timestamp: string,
  timezone: string,
): string {
  if (!validTimestamp(timestamp))
    throw new Error('Invalid reporting timestamp');
  const parts = zonedParts(timestamp, normalizeReportingTimezone(timezone));
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

export function resolveTimezoneAwareRange(
  filters: ReportFilters,
  now: string,
): ReportDateRange {
  if (!validTimestamp(now)) throw new Error('Invalid reporting clock value');
  const timezone = normalizeReportingTimezone(filters.timezone);
  const nowParts = zonedParts(now, timezone);
  const defaultFrom = localDateTimeToIso(
    {
      year: nowParts.year,
      month: nowParts.month,
      day: 1,
      hour: 0,
      minute: 0,
      second: 0,
    },
    timezone,
  );
  const from = filters.from
    ? /^\d{4}-\d{2}-\d{2}$/.test(filters.from)
      ? startOfReportingDay(filters.from, timezone)
      : filters.from
    : defaultFrom;
  const to = filters.to
    ? /^\d{4}-\d{2}-\d{2}$/.test(filters.to)
      ? endOfReportingDay(filters.to, timezone)
      : filters.to
    : now;
  if (!validTimestamp(from) || !validTimestamp(to)) {
    throw new Error('Invalid report date range');
  }
  if (Date.parse(from) > Date.parse(to)) {
    throw new Error('Report start date must not be after end date');
  }
  return { from, to };
}

export function reportingPresetRange(
  preset: 'current_month' | 'last_90_days' | 'all_time',
  now: string,
  timezone = DEFAULT_REPORTING_TIMEZONE,
): ReportDateRange {
  const zone = normalizeReportingTimezone(timezone);
  if (!validTimestamp(now)) throw new Error('Invalid reporting timestamp');
  if (preset === 'all_time') {
    return { from: '1970-01-01T00:00:00.000Z', to: now };
  }
  const parts = zonedParts(now, zone);
  if (preset === 'current_month') {
    return {
      from: localDateTimeToIso(
        {
          year: parts.year,
          month: parts.month,
          day: 1,
          hour: 0,
          minute: 0,
          second: 0,
        },
        zone,
      ),
      to: now,
    };
  }
  const shifted = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day - 89),
  );
  const date = `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}-${String(shifted.getUTCDate()).padStart(2, '0')}`;
  return { from: startOfReportingDay(date, zone), to: now };
}
