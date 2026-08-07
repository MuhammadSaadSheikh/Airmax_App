import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppIcon, AppText, SecondaryButton, Surface } from '@/components';
import type { InternetPackage } from '@/services/packages';
import { animation, colors, money, radius, spacing, typography } from '@/theme';
import { FeatureList } from './FeatureList';
import { SpeedBadge } from './SpeedBadge';
import { AnimatedPressable } from '@/utils/animations';

interface PackageCardProps {
  plan: InternetPackage;
  onPress: () => void;
  delay?: number;
}

function PackageCardComponent({ plan, onPress, delay = 0 }: PackageCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay)
        .springify()
        .damping(animation.spring.responsive.damping)}
    >
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={`View ${plan.name}`}
        onPress={onPress}
      >
        <Surface
          style={[styles.card, plan.isRecommended && styles.recommended]}
        >
          {plan.isRecommended ? (
            <View style={styles.badge}>
              <AppIcon name="star" color={colors.textOnAccent} size={13} />
              <AppText style={styles.badgeText}>RECOMMENDED</AppText>
            </View>
          ) : null}
          <View style={styles.header}>
            <View style={styles.identity}>
              <AppText style={styles.category}>
                {plan.category.toUpperCase()}
              </AppText>
              <AppText style={styles.name}>{plan.name}</AppText>
              <AppText style={styles.devices}>
                Up to {plan.usersSupported} connected users
              </AppText>
            </View>
            <SpeedBadge speed={plan.speed} />
          </View>
          <FeatureList features={plan.features} limit={3} />
          <View style={styles.footer}>
            <View>
              <AppText style={styles.price}>{money(plan.price)}</AppText>
              <AppText style={styles.cycle}>
                per {plan.billingCycle.replace('ly', '')}
              </AppText>
            </View>
            <View style={styles.action}>
              <SecondaryButton title="View plan" onPress={onPress} />
            </View>
          </View>
        </Surface>
      </AnimatedPressable>
    </Animated.View>
  );
}

export const PackageCard = memo(PackageCardComponent);

const styles = StyleSheet.create({
  card: { gap: spacing.lg, overflow: 'hidden' },
  recommended: { borderColor: colors.primary },
  badge: {
    position: 'absolute',
    right: spacing.none,
    top: spacing.none,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomLeftRadius: radius.md,
  },
  badgeText: {
    ...typography.small,
    color: colors.textOnAccent,
    fontFamily: typography.label.fontFamily,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  identity: { flex: 1 },
  category: { ...typography.small, color: colors.primary },
  name: {
    ...typography.sectionTitle,
    color: colors.text,
    marginTop: spacing.xs,
  },
  devices: { ...typography.small, color: colors.muted, marginTop: spacing.xs },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  price: { ...typography.sectionTitle, color: colors.text },
  cycle: { ...typography.small, color: colors.muted },
  action: { minWidth: '42%' },
});
