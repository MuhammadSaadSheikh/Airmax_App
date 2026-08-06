import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { AppIcon, AppText, GradientBackground } from '@/components';
import type { Recommendation } from '@/services/notifications/models';
import {
  animation,
  colors,
  gradients,
  radius,
  spacing,
  typography,
} from '@/theme';

export function RecommendationCard({
  recommendation,
  index = 0,
  onPress,
}: {
  recommendation: Recommendation;
  index?: number;
  onPress: () => void;
}) {
  return (
    <Animated.View
      entering={FadeInRight.delay(index * animation.duration.instant).duration(
        animation.duration.normal,
      )}
      style={styles.wrapper}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Recommended for you. ${recommendation.title}`}
        onPress={onPress}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <GradientBackground
          colors={[...gradients.internetStatus]}
          style={styles.card}
        >
          <View style={styles.icon}>
            <AppIcon name="sparkles" size={22} color={colors.text} />
          </View>
          <AppText style={styles.eyebrow}>RECOMMENDED FOR YOU</AppText>
          <AppText style={styles.title}>{recommendation.title}</AppText>
          <AppText style={styles.description} numberOfLines={3}>
            {recommendation.description}
          </AppText>
          <View style={styles.action}>
            <AppText style={styles.actionLabel}>
              {recommendation.actionLabel}
            </AppText>
            <AppIcon name="arrow-forward" size={17} color={colors.text} />
          </View>
        </GradientBackground>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: 280 },
  card: { minHeight: 210, borderRadius: radius.xl, padding: spacing.lg },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.overlaySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    ...typography.small,
    color: colors.textHeroSecondary,
    marginTop: spacing.md,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.text,
    marginTop: spacing.xs,
  },
  description: {
    ...typography.small,
    color: colors.textHeroSecondary,
    marginTop: spacing.sm,
    flex: 1,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionLabel: { ...typography.label, color: colors.text },
  pressed: { opacity: animation.opacity.pressed },
});
