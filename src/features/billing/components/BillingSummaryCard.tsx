import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppIcon, AppText, Surface } from '@/components';
import type { BillingSummary } from '@/services/billing';
import { colors, spacing, typography } from '@/theme';

function BillingSummaryCardComponent({ summary }: { summary: BillingSummary }) {
  return <Surface style={styles.card}><View style={styles.header}><AppIcon name="repeat-outline" color={colors.primary} size={22} /><View><AppText style={styles.title}>{summary.packageName}</AppText><AppText style={styles.subtitle}>Subscription billing</AppText></View></View><View style={styles.details}><Detail label="Billing cycle" value={summary.billingCycle} /><Detail label="Next payment" value={summary.nextBillingDate} /><Detail label="Renewal" value={summary.renewalStatus} /></View></Surface>;
}
function Detail({ label, value }: { label: string; value: string }) { return <View style={styles.detail}><AppText style={styles.label}>{label}</AppText><AppText style={styles.value}>{value[0]?.toUpperCase()}{value.slice(1)}</AppText></View>; }
export const BillingSummaryCard = memo(BillingSummaryCardComponent);
const styles = StyleSheet.create({
  card: { gap: spacing.lg }, header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md }, title: { ...typography.label, color: colors.text }, subtitle: { ...typography.small, color: colors.muted }, details: { gap: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md }, detail: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }, label: { ...typography.body, color: colors.muted }, value: { ...typography.label, color: colors.text, textAlign: 'right' },
});
