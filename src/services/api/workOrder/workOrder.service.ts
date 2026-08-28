import { environment } from '@/config/environment';
import type { WorkOrderTrackingApiService } from './workOrder.models';

function loadWorkOrderTrackingApiService(): WorkOrderTrackingApiService {
  if (environment.useMockApi) {
    // Lazy loading keeps production free of operational mock state.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./workOrder.mock.service')
      .mockWorkOrderTrackingApiService as WorkOrderTrackingApiService;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('./workOrder.live.service')
    .liveWorkOrderTrackingApiService as WorkOrderTrackingApiService;
}

export const workOrderTrackingApiService = loadWorkOrderTrackingApiService();
