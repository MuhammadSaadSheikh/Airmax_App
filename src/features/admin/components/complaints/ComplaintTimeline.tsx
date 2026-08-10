import { AppText, Surface } from '@/components';
import type { AdminComplaintEvent } from '@/services/api/complaints.models';
import { ComplaintTimelineItem } from './ComplaintTimelineItem';

export function ComplaintTimeline({
  events,
}: {
  events: AdminComplaintEvent[];
}) {
  return (
    <Surface>
      {events.length === 0 ? (
        <AppText>No complaint activity has been recorded.</AppText>
      ) : (
        events.map((event, index) => (
          <ComplaintTimelineItem
            key={event.id}
            event={event}
            last={index === events.length - 1}
          />
        ))
      )}
    </Surface>
  );
}
