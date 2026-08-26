import type { ApiErrorCode, ApiErrorItem, ApiErrorResponse } from './apiTypes';

export type ApiErrorBody = {
  code?: string;
  message?: string;
  details?: unknown;
  requestId?: string;
};

type ParsedError = {
  item?: ApiErrorItem;
  requestId?: string;
  body?: ApiErrorBody;
};

export class ApiError extends Error {
  readonly backendCode?: string;
  readonly requestId?: string;
  readonly details?: unknown;

  constructor(
    message: string,
    readonly status: number | undefined,
    readonly body?: ApiErrorBody,
    readonly code: ApiErrorCode = 'API_ERROR',
  ) {
    super(message);
    this.name = new.target.name;
    this.backendCode = body?.code;
    this.requestId = body?.requestId;
    this.details = body?.details;
  }
}

export class AuthenticationError extends ApiError {}
export class AuthorizationError extends ApiError {}
export class NetworkError extends ApiError {}
export class TimeoutError extends NetworkError {}
export class RequestCancelledError extends NetworkError {}
export class ServerError extends ApiError {}
export class ValidationError extends ApiError {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseError(value: unknown, headerRequestId?: string): ParsedError {
  if (!isRecord(value)) return { requestId: headerRequestId };
  const meta = isRecord(value.meta) ? value.meta : undefined;
  const envelopeRequestId =
    typeof meta?.requestId === 'string' ? meta.requestId : undefined;
  const errors = Array.isArray(value.errors) ? value.errors : [];
  const first = errors.find(isRecord);
  const item =
    first && typeof first.code === 'string' && typeof first.message === 'string'
      ? {
          code: first.code,
          message: first.message,
          ...(first.details === undefined ? {} : { details: first.details }),
        }
      : undefined;
  const legacy: ApiErrorBody = {
    ...(typeof value.code === 'string' ? { code: value.code } : {}),
    ...(typeof value.message === 'string' ? { message: value.message } : {}),
    ...(value.details === undefined ? {} : { details: value.details }),
    ...(typeof value.requestId === 'string'
      ? { requestId: value.requestId }
      : {}),
  };
  const requestId =
    envelopeRequestId ?? legacy.requestId ?? headerRequestId ?? undefined;
  return {
    item,
    requestId,
    body: {
      code: item?.code ?? legacy.code,
      message: item?.message ?? legacy.message,
      details: item?.details ?? legacy.details,
      requestId,
    },
  };
}

export function apiErrorForResponse(
  status: number,
  value?: unknown,
  headerRequestId?: string,
): ApiError {
  const parsed = parseError(value, headerRequestId);
  const message =
    parsed.item?.message ?? parsed.body?.message ?? 'AIRMAX request failed';
  const body = parsed.body;
  if (status === 401) {
    return new AuthenticationError(message, status, body, 'UNAUTHORIZED');
  }
  if (status === 403) {
    return new AuthorizationError(message, status, body, 'FORBIDDEN');
  }
  if (status === 400 || status === 409 || status === 422) {
    return new ValidationError(message, status, body, 'VALIDATION_ERROR');
  }
  if (status >= 500) {
    return new ServerError(message, status, body, 'SERVER_ERROR');
  }
  return new ApiError(message, status, body, 'API_ERROR');
}

export function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return (
    isRecord(value) &&
    value.data === null &&
    isRecord(value.meta) &&
    typeof value.meta.requestId === 'string' &&
    Array.isArray(value.errors)
  );
}

export function isPermanentSessionError(error: unknown): boolean {
  return error instanceof AuthenticationError;
}
