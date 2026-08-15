import { Divider, Row, Surface } from '@/components';
import type { InvoiceCustomer } from '@/services/api/billing.models';

export function InvoiceCustomerCard({
  customer,
}: {
  customer: InvoiceCustomer;
}) {
  return (
    <Surface accessibilityLabel={`Invoice customer ${customer.name}`}>
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
