import { Divider, Row, Surface } from '@/components';
import type { AdminCustomerDetail } from '@/services/api/customers.models';

export function CustomerConnectionCard({
  customer,
}: {
  customer: AdminCustomerDetail;
}) {
  return (
    <Surface>
      <Row
        icon="finger-print-outline"
        title="Connection ID"
        subtitle={customer.connectionId ?? 'Not assigned'}
      />
      <Divider />
      <Row
        icon="calendar-outline"
        title="Installation date"
        subtitle={formatDate(customer.installationDate)}
      />
      <Divider />
      <Row
        icon="hardware-chip-outline"
        title="Router"
        subtitle={formatRouter(customer.routerDetails)}
      />
      <Divider />
      <Row
        icon="key-outline"
        title="PPPoE username"
        subtitle={customer.latestSubscription?.pppoeUsername ?? 'Not assigned'}
      />
    </Surface>
  );
}

function formatDate(value: string | null): string {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Unavailable'
    : new Intl.DateTimeFormat('en-PK', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(date);
}

function formatRouter(details: Record<string, unknown> | null): string {
  if (!details) return 'Not available';
  const model = typeof details.model === 'string' ? details.model : null;
  const serial = typeof details.serial === 'string' ? details.serial : null;
  return [model, serial].filter(Boolean).join(' · ') || 'Configured';
}
