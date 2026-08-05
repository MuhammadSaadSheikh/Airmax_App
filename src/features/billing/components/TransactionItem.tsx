import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppIcon, AppText, Surface } from '@/components';
import type { Payment } from '@/services/billing';
import { colors, money, radius, spacing, typography } from '@/theme';
import { PaymentStatusBadge } from './PaymentStatusBadge';

function TransactionItemComponent({ payment }: { payment: Payment }) {
  return <Surface accessibilityLabel={`Payment ${payment.id}, ${payment.status}`} style={styles.item}><View style={styles.icon}><AppIcon name="swap-horizontal-outline" color={colors.primary} size={21} /></View><View style={styles.copy}><AppText style={styles.id}>{payment.id}</AppText><AppText style={styles.detail}>{payment.date} · {payment.method}</AppText><AppText style={styles.reference}>Reference {payment.reference}</AppText></View><View style={styles.right}><AppText style={styles.amount}>{money(payment.amount)}</AppText><PaymentStatusBadge status={payment.status} /></View></Surface>;
}
export const TransactionItem = memo(TransactionItemComponent);
const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md }, icon: { width: spacing.huge + spacing.sm, height: spacing.huge + spacing.sm, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAccent }, copy: { flex: 1 }, id: { ...typography.label, color: colors.text }, detail: { ...typography.small, color: colors.muted }, reference: { ...typography.small, color: colors.textSecondary }, right: { alignItems: 'flex-end', gap: spacing.xs }, amount: { ...typography.label, color: colors.text },
});
