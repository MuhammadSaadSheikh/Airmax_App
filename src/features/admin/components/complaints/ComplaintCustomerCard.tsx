import { Divider, Row, Surface } from '@/components';
import type { AdminComplaintCustomer } from '@/services/api/complaints.models';

export function ComplaintCustomerCard({
  customer,
}: {
  customer: AdminComplaintCustomer;
}) {
  return (
    <Surface>
      <Row icon="person-outline" title="Customer" subtitle={customer.name} />
      <Divider />
      <Row icon="call-outline" title="Phone" subtitle={customer.phone} />
      <Divider />
      <Row
        icon="wifi-outline"
        title="Connection ID"
        subtitle={customer.connectionId ?? 'Connection pending'}
      />
    </Surface>
  );
}
