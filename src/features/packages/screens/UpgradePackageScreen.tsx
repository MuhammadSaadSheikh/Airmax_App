import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppHeader, AppIcon, AppScreen, AppText, ErrorState, PrimaryButton, SkeletonCard, Surface } from '@/components';
import { FeatureList, SpeedBadge } from '@/features/packages/components';
import { type CustomerStackParamList, useCustomerNavigation } from '@/navigation';
import { packageService } from '@/services/packages';
import { queryKeys } from '@/services/query';
import { useAuthStore } from '@/store/auth.store';
import { animation, colors, money, radius, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<CustomerStackParamList, 'UpgradePackage'>;

export default function UpgradePackageScreen({ route }: Props) {
  const navigation = useCustomerNavigation();
  const connectionId = useAuthStore(state => state.user?.connectionId ?? 'unknown');
  const action = route.params.action ?? 'upgrade';
  const planQuery = useQuery({ queryKey: queryKeys.packageDetail(route.params.id), queryFn: () => packageService.getPackage(route.params.id), staleTime: 60_000 });
  const currentQuery = useQuery({ queryKey: queryKeys.currentPackage(connectionId), queryFn: () => packageService.getCurrentPackage(connectionId), staleTime: 60_000 });
  if (planQuery.isPending || currentQuery.isPending) return <AppScreen><AppHeader title="Confirm plan" showBack /><SkeletonCard lines={6} /></AppScreen>;
  if (planQuery.isError || currentQuery.isError || !planQuery.data) return <AppScreen><AppHeader title="Confirm plan" showBack /><ErrorState title="Plan unavailable" message="We couldn't prepare this plan change." retry={() => { void planQuery.refetch(); void currentQuery.refetch(); }} /></AppScreen>;
  const plan = planQuery.data;
  const current = currentQuery.data.package;
  const speedDifference = plan.speed - current.speed;
  return <AppScreen contentContainerStyle={styles.content}>
    <AppHeader title={action === 'renew' ? 'Renew package' : 'Confirm upgrade'} subtitle="Review before continuing" showBack />
    <Animated.View entering={FadeInDown.duration(animation.duration.normal)}>
      <Surface style={styles.planCard}>
        <View style={styles.top}><View style={styles.identity}><AppText style={styles.eyebrow}>{action === 'renew' ? 'RENEWING' : 'SELECTED PLAN'}</AppText><AppText style={styles.name}>{plan.name}</AppText></View><SpeedBadge speed={plan.speed} /></View>
        <FeatureList features={plan.features} limit={3} />
        <View style={styles.priceRow}><AppText style={styles.price}>{money(plan.price)}</AppText><AppText style={styles.cycle}> / {plan.billingCycle}</AppText></View>
      </Surface>
    </Animated.View>
    {action === 'upgrade' && speedDifference > 0 ? <Surface style={styles.improvement}><View style={styles.icon}><AppIcon name="trending-up-outline" color={colors.success} size={22} /></View><View style={styles.improvementCopy}><AppText style={styles.improvementTitle}>{speedDifference} Mbps faster</AppText><AppText style={styles.improvementText}>Compared with your current {current.speed} Mbps package.</AppText></View></Surface> : null}
    <Surface style={styles.summary}>
      <SummaryRow label="Billing cycle" value={plan.billingCycle} />
      <SummaryRow label="Plan price" value={money(plan.price)} />
      <SummaryRow label="Activation" value={action === 'renew' ? 'After current expiry' : 'Next billing cycle'} />
    </Surface>
    <View style={styles.notice}><AppIcon name="information-circle-outline" color={colors.muted} size={19} /><AppText style={styles.noticeText}>This is a preview flow. No package change occurs until backend billing integration is enabled.</AppText></View>
    <PrimaryButton title="CONTINUE TO PAYMENT" icon="card-outline" onPress={() => navigation.navigate('Payment')} />
  </AppScreen>;
}

function SummaryRow({ label, value }: { label: string; value: string }) { return <View style={styles.summaryRow}><AppText style={styles.summaryLabel}>{label}</AppText><AppText style={styles.summaryValue}>{value[0]?.toUpperCase()}{value.slice(1)}</AppText></View>; }

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.huge, gap: spacing.lg },
  planCard: { gap: spacing.lg, borderColor: colors.primary },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  identity: { flex: 1 },
  eyebrow: { ...typography.small, color: colors.primary },
  name: { ...typography.sectionTitle, color: colors.text, marginTop: spacing.xs },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  price: { ...typography.screenTitle, color: colors.text },
  cycle: { ...typography.body, color: colors.muted },
  improvement: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: spacing.huge + spacing.sm, height: spacing.huge + spacing.sm, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAccent },
  improvementCopy: { flex: 1 },
  improvementTitle: { ...typography.label, color: colors.success },
  improvementText: { ...typography.small, color: colors.muted },
  summary: { gap: spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  summaryLabel: { ...typography.body, color: colors.muted },
  summaryValue: { ...typography.label, color: colors.text, textAlign: 'right', flex: 1 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  noticeText: { ...typography.small, color: colors.muted, flex: 1 },
});
