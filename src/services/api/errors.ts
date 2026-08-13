export type ApiErrorBody = {
  code?: string;
  message?: string;
  details?: unknown;
  requestId?: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number | undefined,
    readonly body?: ApiErrorBody,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class AuthenticationError extends ApiError {}
export class AuthorizationError extends ApiError {}
export class NetworkError extends ApiError {}
export class TimeoutError extends NetworkError {}
export class ServerError extends ApiError {}
export class ValidationError extends ApiError {}

export function apiErrorForResponse(
  status: number,
  body?: ApiErrorBody,
): ApiError {
  const message = body?.message ?? 'AIRMAX request failed';
  if (status === 401) return new AuthenticationError(message, status, body);
  if (status === 403) return new AuthorizationError(message, status, body);
  if (status === 400 || status === 409 || status === 422) {
    return new ValidationError(message, status, body);
  }
  if (status >= 500) return new ServerError(message, status, body);
  return new ApiError(message, status, body);
}

export function isPermanentSessionError(error: unknown): boolean {
  return error instanceof AuthenticationError;
}
