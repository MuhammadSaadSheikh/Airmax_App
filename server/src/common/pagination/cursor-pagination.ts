import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../http/api-exception';

export const DEFAULT_PAGE_LIMIT = 25;
export const MAX_PAGE_LIMIT = 100;

interface CursorPayload {
  v: 1;
  id: string;
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export function isCursorPage(value: unknown): value is CursorPage<unknown> {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<CursorPage<unknown>>;
  return (
    Array.isArray(candidate.items) &&
    (typeof candidate.nextCursor === 'string' ||
      candidate.nextCursor === null) &&
    typeof candidate.hasMore === 'boolean'
  );
}

export function validatePageLimit(
  value: unknown,
  maximum = MAX_PAGE_LIMIT,
  fallback = DEFAULT_PAGE_LIMIT,
): number {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > maximum) {
    throw new ApiException(
      HttpStatus.BAD_REQUEST,
      'INVALID_PAGE_LIMIT',
      `limit must be an integer between 1 and ${maximum}`,
    );
  }
  return parsed;
}

export function encodeCursor(id: string): string {
  if (!id) {
    throw new ApiException(
      HttpStatus.BAD_REQUEST,
      'INVALID_CURSOR',
      'Cursor source must not be empty',
    );
  }
  const payload: CursorPayload = { v: 1, id };
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeCursor(cursor: string): CursorPayload {
  try {
    if (!cursor || cursor.length > 2048) throw new Error('Invalid length');
    const parsed = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8'),
    ) as Partial<CursorPayload>;
    if (parsed.v !== 1 || typeof parsed.id !== 'string' || !parsed.id) {
      throw new Error('Invalid payload');
    }
    return { v: 1, id: parsed.id };
  } catch {
    throw new ApiException(
      HttpStatus.BAD_REQUEST,
      'INVALID_CURSOR',
      'The pagination cursor is invalid',
    );
  }
}

export function buildCursorPage<T>(
  rows: T[],
  limit: number,
  getId: (row: T) => string,
): CursorPage<T> {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows.slice();
  return {
    items,
    hasMore,
    nextCursor:
      hasMore && items.length > 0
        ? encodeCursor(getId(items[items.length - 1]))
        : null,
  };
}
