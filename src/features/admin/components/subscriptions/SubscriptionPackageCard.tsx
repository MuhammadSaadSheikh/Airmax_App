import { StyleSheet, View } from 'react-native';
import { AppText, Divider, Row, Surface } from '@/components';
import type { AdminSubscriptionPackage } from '@/services/api/subscriptions.models';
import { colors, money, spacing, typography } from '@/theme';

export function SubscriptionPackageCard({
  packageItem,
}: {
  packageItem: AdminSubscriptionPackage;
}) {
  return (
    <Surface>
      <View style={styles.header}>
        <View>
          <AppText style={styles.name}>{packageItem.name}</AppText>
          <AppText style={styles.speed}>{packageItem.speedMbps} Mbps</AppText>
        </View>
        <AppText style={styles.price}>{money(packageItem.price)}</AppText>
      </View>
      <Divider />
      <Row
        icon="time-outline"
        title="Billing duration"
        subtitle={`${packageItem.durationDays} days`}
      />
      {packageItem.description ? (
        <>
          <Divider />
          <AppText style={styles.description}>
            {packageItem.description}
          </AppText>
        </>
      ) : null}
    </Surface>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  name: { ...typography.sectionTitle, color: colors.text },
  speed: { ...typography.label, color: colors.primary, marginTop: spacing.xs },
  price: { ...typography.label, color: colors.text },
  description: { ...typography.body, color: colors.textSecondary },
});
