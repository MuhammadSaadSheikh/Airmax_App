export {
  DEFAULT_REQUEST_TIMEOUT_MS,
  apiClient,
  apiRequest,
  type ApiRequestOptions,
} from './apiClient';
export { ApiError } from './apiError';
export type { ApiErrorBody } from './apiError';

export const mockDelay = (milliseconds = 250) =>
  new Promise<void>(resolve => setTimeout(resolve, milliseconds));
