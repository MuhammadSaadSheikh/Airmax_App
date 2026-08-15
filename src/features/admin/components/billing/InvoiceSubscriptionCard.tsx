import { Divider, Row, Surface } from '@/components';
import type { InvoiceSubscription } from '@/services/api/billing.models';
import { money } from '@/theme';

export function InvoiceSubscriptionCard({
  subscription,
}: {
  subscription: InvoiceSubscription;
}) {
  return (
    <Surface accessibilityLabel={`Invoice subscription ${subscription.id}`}>
      <Row
        icon="repeat-outline"
        title="Subscription ID"
        subtitle={subscription.id}
      />
      <Divider />
      <Row
        icon="cube-outline"
        title="Package snapshot"
        subtitle={subscription.packageName}
      />
      <Divider />
      <Row
        icon="speedometer-outline"
        title="Package speed"
        subtitle={`${subscription.packageSpeedMbps} Mbps`}
      />
      <Divider />
      <Row
        icon="cash-outline"
        title="Package price snapshot"
        subtitle={money(subscription.packagePrice)}
      />
    </Surface>
  );
}
