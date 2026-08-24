import { randomUUID } from 'node:crypto';

export const REQUEST_ID_HEADER = 'x-request-id';
export const REQUEST_ID_MAX_LENGTH = 128;

const SAFE_REQUEST_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

export function isValidRequestId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length <= REQUEST_ID_MAX_LENGTH &&
    SAFE_REQUEST_ID.test(value)
  );
}

export function resolveRequestId(value: unknown): string {
  return isValidRequestId(value) ? value : `req_${randomUUID()}`;
}
