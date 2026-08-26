export type ApiEnvironment =
  'mock' | 'development-live' | 'staging' | 'production';

export type ApiResponseMeta = {
  requestId: string;
  generatedAt?: string;
};

export type ApiErrorItem = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiResponse<T> = {
  data: T;
  meta: ApiResponseMeta;
  errors: [];
};

export type ApiErrorResponse = {
  data: null;
  meta: Pick<ApiResponseMeta, 'requestId'>;
  errors: ApiErrorItem[];
};

export type ApiRequestMetadata = {
  requestId: string;
  generatedAt?: string;
  status: number;
};

export type ApiRequestConfig = {
  authenticate?: boolean;
  refreshOnUnauthorized?: boolean;
  timeoutMs?: number;
  requestId?: string;
  onResponseMeta?: (metadata: ApiRequestMetadata) => void;
};

export type ApiErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'REQUEST_CANCELLED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'SERVER_ERROR'
  | 'API_ERROR';
