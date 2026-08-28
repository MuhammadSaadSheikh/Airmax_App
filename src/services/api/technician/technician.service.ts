import { environment } from '@/config/environment';
import type { TechnicianVisibilityApiService } from './technician.models';

function loadTechnicianVisibilityApiService(): TechnicianVisibilityApiService {
  if (environment.useMockApi) {
    // Lazy loading keeps production free of operational mock state.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./technician.mock.service')
      .mockTechnicianVisibilityApiService as TechnicianVisibilityApiService;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('./technician.live.service')
    .liveTechnicianVisibilityApiService as TechnicianVisibilityApiService;
}

export const technicianVisibilityApiService =
  loadTechnicianVisibilityApiService();
