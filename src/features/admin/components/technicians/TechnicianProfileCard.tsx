import { Divider, Row, Surface } from '@/components';
import type { AdminTechnician } from '@/services/api/technicians.models';
import { TechnicianStatusBadge } from './TechnicianStatusBadge';

export function TechnicianProfileCard({
  technician,
}: {
  technician: AdminTechnician;
}) {
  return (
    <Surface accessibilityLabel={`Technician profile ${technician.name}`}>
      <TechnicianStatusBadge status={technician.status} />
      <Divider />
      <Row icon="person-outline" title="Name" subtitle={technician.name} />
      <Divider />
      <Row icon="call-outline" title="Phone" subtitle={technician.phone} />
      <Divider />
      <Row
        icon="location-outline"
        title="Service area"
        subtitle={`${technician.area.name}, ${technician.area.city}`}
      />
    </Surface>
  );
}
