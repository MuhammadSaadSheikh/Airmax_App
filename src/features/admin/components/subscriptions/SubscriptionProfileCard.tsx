import { Divider, Row, Surface } from '@/components';
import type { AdminSubscriptionCustomer } from '@/services/api/subscriptions.models';

export function SubscriptionProfileCard({
  customer,
}: {
  customer: AdminSubscriptionCustomer;
}) {
  return (
    <Surface accessibilityLabel={`Customer ${customer.name}`}>
      <Row icon="person-outline" title="Customer" subtitle={customer.name} />
      <Divider />
      <Row icon="call-outline" title="Phone" subtitle={customer.phone} />
      <Divider />
      <Row
        icon="mail-outline"
        title="Email"
        subtitle={customer.email ?? 'Not provided'}
      />
      <Divider />
      <Row
        icon="wifi-outline"
        title="Connection ID"
        subtitle={customer.connectionId ?? 'Connection pending'}
      />
    </Surface>
  );
}
