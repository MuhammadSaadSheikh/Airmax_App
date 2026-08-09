import { StyleSheet, View } from 'react-native';
import { AppText, Divider, EmptyState, Row, Surface } from '@/components';
import type { AdminCustomerSubscription } from '@/services/api/customers.models';
import { colors, money, spacing, typography } from '@/theme';
import { CustomerStatusBadge } from './CustomerStatusBadge';

export function CustomerSubscriptionCard({
  subscription,
}: {
  subscription: AdminCustomerSubscription | null;
}) {
  if (!subscription) {
    return (
      <Surface>
        <EmptyState
          title="No subscription"
          message="This customer does not have a subscription record."
          icon="cube-outline"
        />
      </Surface>
    );
  }

  return (
    <Surface>
      <View style={styles.header}>
        <View>
          <AppText style={styles.packageName}>
            {subscription.package.name}
          </AppText>
          <AppText style={styles.speed}>
            {subscription.package.speedMbps} Mbps
          </AppText>
        </View>
        <CustomerStatusBadge status={subscription.status} />
      </View>
      <Divider />
      <Row
        icon="cash-outline"
        title="Package price"
        subtitle={money(subscription.package.price)}
      />
      <Divider />
      <Row
        icon="play-circle-outline"
        title="Starts"
        subtitle={formatDate(subscription.startsAt)}
      />
      <Divider />
      <Row
        icon="calendar-outline"
        title="Expires"
        subtitle={formatDate(subscription.expiresAt)}
      />
    </Surface>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Unavailable'
    : new Intl.DateTimeFormat('en-PK', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(date);
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  packageName: { ...typography.sectionTitle, color: colors.text },
  speed: { ...typography.label, color: colors.primary, marginTop: spacing.xs },
});
