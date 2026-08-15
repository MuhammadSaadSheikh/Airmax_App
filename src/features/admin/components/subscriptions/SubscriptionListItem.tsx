import { StyleSheet, View } from 'react-native';
import { AppIcon, AppText, Surface } from '@/components';
import type { AdminSubscription } from '@/services/api/subscriptions.models';
import { colors, money, spacing, typography } from '@/theme';
import { AnimatedPressable } from '@/utils/animations';
import { SubscriptionStatusBadge } from './SubscriptionStatusBadge';

function displayDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Unavailable'
    : new Intl.DateTimeFormat('en-PK', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date);
}

export function SubscriptionListItem({
  subscription,
  onPress,
}: {
  subscription: AdminSubscription;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`Open subscription ${subscription.id} for ${subscription.customer.name}`}
      onPress={onPress}
    >
      <Surface style={styles.card}>
        <View style={styles.header}>
          <View style={styles.identity}>
            <AppText numberOfLines={1} style={styles.customer}>
              {subscription.customer.name}
            </AppText>
            <AppText style={styles.id}>{subscription.id}</AppText>
          </View>
          <SubscriptionStatusBadge status={subscription.status} />
        </View>
        <View style={styles.packageRow}>
          <View style={styles.packageCopy}>
            <AppText style={styles.package}>
              {subscription.package.name}
            </AppText>
            <AppText style={styles.speed}>
              {subscription.package.speedMbps} Mbps
            </AppText>
          </View>
          <AppText style={styles.price}>
            {money(subscription.package.price)}
          </AppText>
        </View>
        <View style={styles.expiryRow}>
          <AppIcon name="calendar-outline" size={16} color={colors.muted} />
          <AppText style={styles.expiry}>
            Expires {displayDate(subscription.expiresAt)}
          </AppText>
        </View>
      </Surface>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  identity: { flex: 1 },
  customer: { ...typography.sectionTitle, color: colors.text },
  id: { ...typography.small, color: colors.muted, marginTop: spacing.xs },
  packageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  packageCopy: { flex: 1 },
  package: { ...typography.label, color: colors.textSecondary },
  speed: { ...typography.small, color: colors.primary, marginTop: spacing.xs },
  price: { ...typography.label, color: colors.text },
  expiryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  expiry: { ...typography.small, color: colors.muted },
});
