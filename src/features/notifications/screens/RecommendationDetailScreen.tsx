import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import {
  AppHeader,
  AppIcon,
  AppScreen,
  AppText,
  ErrorState,
  GradientBackground,
  PrimaryButton,
  SkeletonCard,
  Surface,
} from '@/components';
import { useNotificationAction } from '@/features/notifications/hooks/useNotificationAction';
import type { CustomerStackParamList } from '@/navigation/types';
import { personalizationService } from '@/services/notifications/personalizationService';
import { queryKeys } from '@/services/query';
import {
  animation,
  colors,
  gradients,
  radius,
  spacing,
  typography,
} from '@/theme';

type Props = NativeStackScreenProps<
  CustomerStackParamList,
  'RecommendationDetail'
>;

export default function RecommendationDetailScreen({ route }: Props) {
  const performAction = useNotificationAction();
  const query = useQuery({
    queryKey: queryKeys.recommendationDetail(route.params.id),
    queryFn: () => personalizationService.getRecommendation(route.params.id),
    staleTime: 60_000,
  });

  if (query.isPending) {
    return (
      <AppScreen>
        <AppHeader title="Recommendation" showBack />
        <SkeletonCard lines={6} />
      </AppScreen>
    );
  }
  if (query.isError || !query.data) {
    return (
      <AppScreen>
        <AppHeader title="Recommendation" showBack />
        <ErrorState
          title="Recommendation unavailable"
          message="We couldn't load this personalized suggestion."
          retry={() => void query.refetch()}
        />
      </AppScreen>
    );
  }

  const recommendation = query.data;
  return (
    <AppScreen contentContainerStyle={styles.content}>
      <AppHeader
        title="Recommendation"
        subtitle="Personalized for your connection"
        showBack
      />
      <Animated.View entering={FadeInUp.duration(animation.duration.slow)}>
        <GradientBackground
          colors={[...gradients.internetStatus]}
          style={styles.hero}
        >
          <View style={styles.heroIcon}>
            <AppIcon name="sparkles" size={29} color={colors.text} />
          </View>
          <AppText style={styles.eyebrow}>SMART AIRMAX SUGGESTION</AppText>
          <AppText style={styles.title}>{recommendation.title}</AppText>
          <AppText style={styles.description}>
            {recommendation.description}
          </AppText>
        </GradientBackground>
      </Animated.View>
      <Surface style={styles.benefit}>
        <View style={styles.benefitIcon}>
          <AppIcon name="trending-up-outline" color={colors.success} />
        </View>
        <View style={styles.benefitCopy}>
          <AppText style={styles.benefitLabel}>WHY THIS MAY HELP</AppText>
          <AppText style={styles.benefitText}>{recommendation.benefit}</AppText>
        </View>
      </Surface>
      <View style={styles.disclosure}>
        <AppIcon name="information-circle-outline" color={colors.muted} />
        <AppText style={styles.disclosureText}>
          Suggestions use mock usage patterns in this preview. Future
          personalization will respect your notification preferences.
        </AppText>
      </View>
      <PrimaryButton
        title={recommendation.actionLabel.toUpperCase()}
        icon="arrow-forward"
        onPress={() => performAction(recommendation.action)}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.huge, gap: spacing.lg },
  hero: {
    minHeight: 280,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    justifyContent: 'flex-end',
  },
  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: radius.lg,
    backgroundColor: colors.overlaySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  eyebrow: { ...typography.small, color: colors.textHeroSecondary },
  title: {
    ...typography.screenTitle,
    color: colors.text,
    marginTop: spacing.sm,
  },
  description: {
    ...typography.bodyLarge,
    color: colors.textHeroSecondary,
    marginTop: spacing.md,
  },
  benefit: { flexDirection: 'row', gap: spacing.md },
  benefitIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: `${colors.success}1A`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitCopy: { flex: 1 },
  benefitLabel: { ...typography.small, color: colors.success },
  benefitText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  disclosure: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  disclosureText: { ...typography.small, color: colors.muted, flex: 1 },
});
