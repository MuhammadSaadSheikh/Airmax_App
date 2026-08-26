import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  AppHeader,
  AppIcon,
  AppScreen,
  AppText,
  ErrorState,
  SkeletonCard,
  Surface,
} from '@/components';
import {
  FeatureList,
  PackageBenefits,
  SpeedBadge,
  UpgradeBanner,
} from '@/features/packages/components';
import {
  type CustomerStackParamList,
  useCustomerNavigation,
} from '@/navigation';
import { authenticatedPackageService } from '@/services/package';
import { queryKeys } from '@/services/query';
import { animation, colors, money, radius, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<CustomerStackParamList, 'PackageDetail'>;

export default function PackageDetailScreen({ route }: Props) {
  const navigation = useCustomerNavigation();
  const query = useQuery({
    queryKey: queryKeys.packageDetail(route.params.id),
    queryFn: () => authenticatedPackageService.getPackage(route.params.id),
    staleTime: 60_000,
  });
  if (query.isPending)
    return (
      <AppScreen>
        <AppHeader title="Package details" showBack />
        <SkeletonCard lines={6} />
      </AppScreen>
    );
  if (query.isError || !query.data)
    return (
      <AppScreen>
        <AppHeader title="Package details" showBack />
        <ErrorState
          title="Package unavailable"
          message="This package could not be found."
          retry={() => void query.refetch()}
        />
      </AppScreen>
    );
  const plan = query.data;
  return (
    <AppScreen contentContainerStyle={styles.content}>
      <AppHeader
        title={plan.name}
        subtitle="AIRMAX internet package"
        showBack
      />
      <Animated.View entering={FadeInDown.duration(animation.duration.normal)}>
        <Surface style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.identity}>
              <AppText style={styles.category}>
                {plan.category.toUpperCase()} PLAN
              </AppText>
              <AppText style={styles.description}>{plan.description}</AppText>
            </View>
            <SpeedBadge speed={plan.speed} />
          </View>
          <SpeedMeter speed={plan.speed} />
          <View style={styles.priceRow}>
            <AppText style={styles.price}>{money(plan.price)}</AppText>
            <AppText style={styles.cycle}> / {plan.billingCycle}</AppText>
          </View>
          <AppText style={styles.users}>
            Designed for up to {plan.usersSupported} connected users
          </AppText>
        </Surface>
      </Animated.View>
      <SectionTitle title="What’s included" />
      <Surface>
        <FeatureList features={plan.features} />
      </Surface>
      <SectionTitle title="Plan benefits" />
      <PackageBenefits benefits={plan.benefits} />
      <SectionTitle title="Frequently asked questions" />
      <Surface style={styles.faqs}>
        {plan.faqs.map(item => (
          <FaqItem
            key={item.question}
            question={item.question}
            answer={item.answer}
          />
        ))}
      </Surface>
      <UpgradeBanner
        plan={plan}
        onUpgrade={() =>
          navigation.navigate('UpgradePackage', {
            id: plan.id,
            action: 'upgrade',
          })
        }
      />
    </AppScreen>
  );
}

function SpeedMeter({ speed }: { speed: number }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(Math.min(speed / 300, 1), {
      duration: animation.duration.slow,
    });
  }, [progress, speed]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
  }));
  return (
    <View
      accessible
      accessibilityLabel={`Speed meter ${speed} megabits per second`}
      style={styles.meter}
    >
      <Animated.View style={[styles.meterFill, style]} />
    </View>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      onPress={() => setOpen(value => !value)}
      style={({ pressed }) => [styles.faq, pressed && styles.pressed]}
    >
      <View style={styles.faqHeader}>
        <AppText style={styles.faqQuestion}>{question}</AppText>
        <AppIcon
          name={open ? 'chevron-up' : 'chevron-down'}
          color={colors.muted}
          size={19}
        />
      </View>
      {open ? <AppText style={styles.faqAnswer}>{answer}</AppText> : null}
    </Pressable>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <AppText style={styles.sectionTitle}>{title}</AppText>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.huge, gap: spacing.lg },
  hero: { gap: spacing.lg, backgroundColor: colors.surfaceStrong },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  identity: { flex: 1, gap: spacing.xs },
  category: { ...typography.small, color: colors.primary },
  description: { ...typography.body, color: colors.textSecondary },
  meter: {
    height: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    transformOrigin: 'left',
  },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  price: { ...typography.screenTitle, color: colors.text },
  cycle: { ...typography.body, color: colors.muted },
  users: { ...typography.small, color: colors.muted },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.text,
    marginTop: spacing.sm,
  },
  faqs: { gap: spacing.sm },
  faq: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  faqHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  faqQuestion: { ...typography.label, color: colors.text, flex: 1 },
  faqAnswer: { ...typography.body, color: colors.textSecondary },
  pressed: { opacity: animation.opacity.pressed },
});
