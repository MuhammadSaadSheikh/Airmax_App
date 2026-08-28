import { apiRequest } from '../client';
import { mapWorkOrderDto } from './workOrder.mapper';
import type {
  WorkOrderDto,
  WorkOrderTrackingApiService,
} from './workOrder.models';

export const liveWorkOrderTrackingApiService: WorkOrderTrackingApiService = {
  async getWorkOrderById(id) {
    return mapWorkOrderDto(
      await apiRequest<WorkOrderDto>(`/work-orders/${encodeURIComponent(id)}`),
    );
  },
};
