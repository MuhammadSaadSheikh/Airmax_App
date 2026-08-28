import { environment } from '@/config/environment';
import type { ComplaintApiService } from './complaint.models';

function loadComplaintApiService(): ComplaintApiService {
  if (environment.useMockApi) {
    // Lazy loading keeps production free of operational mock state.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./complaint.mock.service')
      .mockComplaintApiService as ComplaintApiService;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('./complaint.live.service')
    .liveComplaintApiService as ComplaintApiService;
}

export const complaintApiService = loadComplaintApiService();
