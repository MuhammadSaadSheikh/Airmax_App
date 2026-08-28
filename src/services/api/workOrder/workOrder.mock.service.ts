import { mockComplaintRepository } from '../complaints.mock.repository';
import { resolveMockCustomer } from '../mockCustomerContext';
import { mockTechnicianRepository } from '../technicians.mock.repository';
import { mapWorkOrderDto } from './workOrder.mapper';
import type { WorkOrderTrackingApiService } from './workOrder.models';

const mockDelay = (milliseconds = 250) =>
  new Promise<void>(resolve => setTimeout(resolve, milliseconds));

export const mockWorkOrderTrackingApiService: WorkOrderTrackingApiService = {
  async getWorkOrderById(id) {
    await mockDelay();
    const snapshot = mockTechnicianRepository.snapshot();
    const workOrder = snapshot.workOrders.find(item => item.id === id);
    if (!workOrder) throw new Error('Work order not found');
    const complaint = mockComplaintRepository.getById(workOrder.complaintId);
    const customer = resolveMockCustomer('unknown');
    if (!complaint || complaint.userId !== customer.id) {
      throw new Error('Work order not found');
    }
    const technician = snapshot.technicians.find(
      item => item.id === workOrder.technicianId,
    );
    if (!technician) throw new Error('Technician not found');
    const events = snapshot.history.filter(item => item.workOrderId === id);
    return mapWorkOrderDto({
      id: workOrder.id,
      complaintId: workOrder.complaintId,
      status: workOrder.status,
      technician: {
        id: technician.id,
        name: technician.name,
        status: technician.status,
      },
      assignedAt: workOrder.createdAt,
      acceptedAt:
        events.find(item => item.action === 'WORK_ORDER_ACCEPTED')?.createdAt ??
        null,
      startedAt:
        events.find(item => item.action === 'WORK_ORDER_STARTED')?.createdAt ??
        null,
      completedAt: workOrder.completedAt,
    });
  },
};
