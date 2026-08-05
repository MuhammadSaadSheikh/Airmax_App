import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppIcon,
  AppText,
  PrimaryButton,
  SecondaryButton,
  Surface,
} from '@/components';
import type { CurrentPlan } from '@/services/network';
import { colors, money, radius, spacing, typography } from '@/theme';

interface CurrentPlanCardProps {
  plan: CurrentPlan;
  onUpgrade: () => void;
  onRenew: () => void;
  onViewDetails?: () => void;
}

function CurrentPlanCardComponent({
  plan,
  onUpgrade,
  onRenew,
  onViewDetails,
}: CurrentPlanCardProps) {
  return (
    <Surface
      accessibilityLabel={`Current package ${plan.name}`}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <View style={styles.planIdentity}>
          <View style={styles.icon}>
            <AppIcon name="flash" color={colors.primary} size={22} />
          </View>
          <View>
            <AppText style={styles.overline}>CURRENT PACKAGE</AppText>
            <AppText style={styles.name}>{plan.name}</AppText>
          </View>
        </View>
        <View style={styles.daysPill}>
          <AppText style={styles.days}>{plan.remainingDays} days left</AppText>
        </View>
      </View>

      <View style={styles.metrics}>
        <View
          accessible
          accessibilityLabel={`${plan.speedMbps} megabits per second`}
        >
          <AppText style={styles.metricLabel}>SPEED</AppText>
          <AppText style={styles.metricValue}>{plan.speedMbps} Mbps</AppText>
        </View>
        <View
          accessible
          accessibilityLabel={`${money(plan.monthlyPrice)} monthly`}
        >
          <AppText style={styles.metricLabel}>
            {(plan.billingCycle ?? 'monthly').toUpperCase()}
          </AppText>
          <AppText style={styles.metricValue}>
            {money(plan.monthlyPrice)}
          </AppText>
        </View>
        <View accessible accessibilityLabel={`Expires ${plan.expiryDate}`}>
          <AppText style={styles.metricLabel}>EXPIRES</AppText>
          <AppText style={styles.metricValue}>{plan.expiryDate}</AppText>
        </View>
      </View>

      <View style={styles.actions}>
        <View style={styles.action}>
          <SecondaryButton
            title="Upgrade"
            icon="arrow-up-circle-outline"
            onPress={onUpgrade}
          />
        </View>
        <View style={styles.action}>
          <PrimaryButton
            title="Renew plan"
            icon="refresh-outline"
            onPress={onRenew}
          />
        </View>
      </View>
      {onViewDetails ? (
        <SecondaryButton
          title="View details"
          icon="information-circle-outline"
          onPress={onViewDetails}
        />
      ) : null}
    </Surface>
  );
}

export const CurrentPlanCard = memo(CurrentPlanCardComponent);

const styles = StyleSheet.create({
  card: { gap: spacing.xl, backgroundColor: colors.surfaceElevated },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  planIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  icon: {
    width: spacing.huge + spacing.md,
    height: spacing.huge + spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overline: {
    ...typography.small,
    color: colors.muted,
    fontFamily: typography.label.fontFamily,
  },
  name: {
    ...typography.sectionTitle,
    color: colors.text,
    marginTop: spacing.xs,
  },
  daysPill: {
    backgroundColor: colors.surfaceAccent,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  days: {
    ...typography.small,
    color: colors.primary,
    fontFamily: typography.label.fontFamily,
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  metricLabel: { ...typography.small, color: colors.muted },
  metricValue: {
    ...typography.label,
    color: colors.text,
    marginTop: spacing.xs,
  },
  actions: { flexDirection: 'row', gap: spacing.md },
  action: { flex: 1 },
});
