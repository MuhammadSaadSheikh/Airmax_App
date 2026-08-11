import { StyleSheet, View } from 'react-native';
import { AppText, Divider, Row, Surface } from '@/components';
import type { AdminPackage } from '@/services/api/packages.models';
import { colors, money, spacing, typography } from '@/theme';

export function PackageMetricsCard({
  packageItem,
}: {
  packageItem: AdminPackage;
}) {
  return (
    <Surface>
      <Row
        icon="speedometer-outline"
        title="Internet speed"
        subtitle={`${packageItem.speedMbps} Mbps`}
      />
      <Divider />
      <Row
        icon="cash-outline"
        title="Package price"
        subtitle={money(packageItem.price)}
      />
      <Divider />
      <Row
        icon="calendar-outline"
        title="Duration"
        subtitle={`${packageItem.durationDays} days`}
      />
      <Divider />
      <Row
        icon="people-outline"
        title="Subscribers"
        subtitle={`${packageItem.subscriberCount.toLocaleString('en-PK')} mock subscribers`}
      />
      <Divider />
      <View style={styles.features}>
        <AppText style={styles.title}>Package features</AppText>
        {packageItem.features.map(feature => (
          <View key={feature} style={styles.feature}>
            <AppText style={styles.bullet}>•</AppText>
            <AppText style={styles.featureText}>{feature}</AppText>
          </View>
        ))}
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  features: { gap: spacing.sm },
  title: { ...typography.bodyLarge, color: colors.text },
  feature: { flexDirection: 'row', gap: spacing.sm },
  bullet: { color: colors.primary },
  featureText: { flex: 1, ...typography.body, color: colors.textSecondary },
});
