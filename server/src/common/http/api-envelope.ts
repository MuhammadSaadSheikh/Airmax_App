export interface ApiErrorItem {
  code: string;
  message: string;
  field?: string;
  details?: unknown;
}

export interface ApiPaginationMeta {
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ApiMeta {
  requestId: string;
  generatedAt: string;
  pagination?: ApiPaginationMeta;
}

export interface ApiEnvelope<T> {
  data: T | null;
  meta: ApiMeta;
  errors: ApiErrorItem[];
}

export function createSuccessEnvelope<T>(
  data: T,
  requestId: string,
  pagination?: ApiPaginationMeta,
  generatedAt = new Date(),
): ApiEnvelope<T> {
  return {
    data,
    meta: {
      requestId,
      generatedAt: generatedAt.toISOString(),
      ...(pagination ? { pagination } : {}),
    },
    errors: [],
  };
}

export function createErrorEnvelope(
  errors: ApiErrorItem[],
  requestId: string,
  generatedAt = new Date(),
): ApiEnvelope<never> {
  return {
    data: null,
    meta: { requestId, generatedAt: generatedAt.toISOString() },
    errors,
  };
}
