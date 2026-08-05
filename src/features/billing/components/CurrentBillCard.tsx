import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppIcon, AppText, GradientBackground, PrimaryButton, SecondaryButton } from '@/components';
import type { CurrentBillSnapshot } from '@/services/billing';
import { colors, gradients, money, radius, spacing, typography } from '@/theme';
import { PaymentStatusBadge } from './PaymentStatusBadge';

function CurrentBillCardComponent({ bill, onPay, onInvoice }: { bill: CurrentBillSnapshot; onPay: () => void; onInvoice: () => void }) {
  return <GradientBackground colors={[...gradients.internetStatus]} style={styles.card}>
    <View style={styles.header}><View><AppText style={styles.eyebrow}>CURRENT BILL</AppText><AppText style={styles.amount}>{money(bill.summary.currentAmount)}</AppText></View><PaymentStatusBadge status={bill.summary.status} /></View>
    <View style={styles.details}><View><AppText style={styles.label}>DUE DATE</AppText><AppText style={styles.value}>{bill.summary.dueDate}</AppText></View><View style={styles.days}><AppIcon name="time-outline" color={colors.white} size={18} /><AppText style={styles.daysText}>{bill.summary.daysRemaining} days remaining</AppText></View></View>
    <View style={styles.actions}><View style={styles.action}><PrimaryButton title="Pay now" icon="lock-closed-outline" onPress={onPay} /></View><View style={styles.action}><SecondaryButton title="View invoice" icon="document-text-outline" onPress={onInvoice} /></View></View>
  </GradientBackground>;
}
export const CurrentBillCard = memo(CurrentBillCardComponent);

const styles = StyleSheet.create({
  card: { borderRadius: radius.xxl, padding: spacing.xl, gap: spacing.xl, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  eyebrow: { ...typography.small, color: colors.textHero },
  amount: { ...typography.screenTitle, color: colors.white, marginTop: spacing.xs },
  details: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderOnAccent, paddingTop: spacing.lg },
  label: { ...typography.small, color: colors.textHero },
  value: { ...typography.label, color: colors.white, marginTop: spacing.xs },
  days: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  daysText: { ...typography.small, color: colors.white },
  actions: { flexDirection: 'row', gap: spacing.md },
  action: { flex: 1 },
});
