import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { AppIcon, AppText, GradientBackground, PrimaryButton } from '@/components';
import type { InternetPackage, Recommendation } from '@/services/packages';
import { animation, colors, gradients, radius, spacing, typography } from '@/theme';
import { SpeedBadge } from './SpeedBadge';

function RecommendedPlanCardComponent({ plan, recommendation, onUpgrade }: { plan: InternetPackage; recommendation: Recommendation; onUpgrade: () => void }) {
  const glow = useSharedValue(1);
  useEffect(() => { glow.value = withRepeat(withTiming(animation.opacity.disabled, { duration: animation.duration.slow }), -1, true); }, [glow]);
  const badgeStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  return <GradientBackground colors={[...gradients.internetStatus]} style={styles.card}>
    <View style={styles.header}><Animated.View style={[styles.badge, badgeStyle]}><AppIcon name="sparkles" color={colors.white} size={16} /><AppText style={styles.badgeText}>RECOMMENDED FOR YOU</AppText></Animated.View><SpeedBadge speed={plan.speed} /></View>
    <AppText style={styles.name}>{plan.name}</AppText>
    <AppText style={styles.reasonTitle}>Why this fits you</AppText>
    <View style={styles.reasons}>{recommendation.reason.map(reason => <View key={reason} style={styles.reason}><AppIcon name="checkmark-circle" color={colors.success} size={18} /><AppText style={styles.reasonText}>{reason}</AppText></View>)}</View>
    <PrimaryButton title="Upgrade now" icon="arrow-up-circle-outline" onPress={onUpgrade} />
  </GradientBackground>;
}

export const RecommendedPlanCard = memo(RecommendedPlanCardComponent);

const styles = StyleSheet.create({
  card: { borderRadius: radius.xxl, padding: spacing.xl, gap: spacing.md, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  badge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  badgeText: { ...typography.small, color: colors.white, fontFamily: typography.label.fontFamily },
  name: { ...typography.screenTitle, color: colors.white },
  reasonTitle: { ...typography.label, color: colors.textHero },
  reasons: { gap: spacing.sm },
  reason: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reasonText: { ...typography.body, color: colors.white, flex: 1 },
});
