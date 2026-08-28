import type {
  Complaint,
  ComplaintCategory,
  ComplaintDetail,
  ComplaintStatus,
  ComplaintTimeline,
  CreateComplaintInput,
} from '@/services/support/models';
import type {
  ComplaintDto,
  ComplaintPriorityDto,
  ComplaintStatusDto,
  CreateComplaintDto,
} from './complaint.models';

const stages: Array<{
  status: ComplaintStatus;
  apiStatus: ComplaintStatusDto;
  description: string;
}> = [
  {
    status: 'submitted',
    apiStatus: 'PENDING',
    description: 'Your complaint was received.',
  },
  {
    status: 'assigned',
    apiStatus: 'ASSIGNED',
    description: 'A support specialist was assigned.',
  },
  {
    status: 'technician_working',
    apiStatus: 'IN_PROGRESS',
    description: 'Technician is investigating the issue.',
  },
  {
    status: 'resolved',
    apiStatus: 'RESOLVED',
    description: 'Service restored and confirmed.',
  },
];

export function mapComplaintStatus(
  status: ComplaintStatusDto,
): ComplaintStatus {
  if (status === 'PENDING') return 'submitted';
  if (status === 'ASSIGNED') return 'assigned';
  if (status === 'IN_PROGRESS') return 'technician_working';
  return 'resolved';
}

function mapCategory(category: string): ComplaintCategory {
  const normalized = category.toLowerCase();
  if (normalized.includes('speed')) return 'speed';
  if (normalized.includes('router')) return 'router';
  if (normalized.includes('bill')) return 'billing';
  return 'internet';
}

function categoryDto(category: ComplaintCategory): string {
  if (category === 'speed') return 'Speed issue';
  if (category === 'router') return 'Router issue';
  if (category === 'billing') return 'Billing issue';
  return 'Internet issue';
}

function categoryPriority(category: ComplaintCategory): ComplaintPriorityDto {
  if (category === 'internet') return 'HIGH';
  if (category === 'billing') return 'LOW';
  return 'MEDIUM';
}

function mapTimeline(dto: ComplaintDto): ComplaintTimeline[] {
  const status = mapComplaintStatus(dto.status);
  const currentIndex = stages.findIndex(stage => stage.status === status);
  return stages.map((stage, index) => {
    const event = dto.history.find(
      item => item.currentStatus === stage.apiStatus,
    );
    return {
      status: stage.status,
      description: stage.description,
      completed: index <= currentIndex,
      timestamp: event?.occurredAt,
    };
  });
}

function currentWorkOrderId(dto: ComplaintDto): string | undefined {
  const current = [...dto.workOrders]
    .reverse()
    .find(item => item.status !== 'CANCELLED');
  return current?.id ?? dto.workOrders.at(-1)?.id;
}

export function mapComplaintDto(dto: ComplaintDto): ComplaintDetail {
  const terminal = dto.status === 'RESOLVED' || dto.status === 'CLOSED';
  const resolution = [...dto.history]
    .reverse()
    .find(item => item.currentStatus === 'RESOLVED')?.message;
  return {
    id: dto.id,
    category: mapCategory(dto.category),
    title: dto.title ?? 'Title unavailable',
    description: dto.description,
    status: mapComplaintStatus(dto.status),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    expectedResolution: terminal ? 'Resolved' : 'Update pending',
    attachments: dto.attachmentUrl
      ? [
          {
            id: `${dto.id}-attachment-1`,
            type: 'image',
            uri: dto.attachmentUrl,
          },
        ]
      : undefined,
    workOrderId: currentWorkOrderId(dto),
    timeline: mapTimeline(dto),
    resolution: terminal ? (resolution ?? 'Complaint resolved.') : undefined,
  };
}

export function mapComplaintListDto(dto: ComplaintDto): Complaint {
  return mapComplaintDto(dto);
}

export function mapCreateComplaintInput(
  input: CreateComplaintInput,
): CreateComplaintDto {
  return {
    title: input.title.trim(),
    description: input.description.trim(),
    category: categoryDto(input.category),
    priority: categoryPriority(input.category),
  };
}
