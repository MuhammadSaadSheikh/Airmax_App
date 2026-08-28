import { environment } from '@/config/environment';
import type { SupportService } from './supportService.types';

function loadSupportService(): SupportService {
  if (environment.useMockApi) {
    // Lazy loading prevents production from initializing support mock state.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./support.mock.service')
      .mockSupportService as SupportService;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('./support.live.service').liveSupportService as SupportService;
}

export const supportService = loadSupportService();
export type { SupportService } from './supportService.types';
