import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Surface } from '@/components';
import type { Invoice } from '@/services/billing';
import { colors, money, spacing, typography } from '@/theme';
import { PaymentStatusBadge } from './PaymentStatusBadge';

function ReceiptPreviewComponent({ invoice }: { invoice: Invoice }) {
  return <Surface accessibilityLabel={`Receipt preview for ${invoice.id}`} style={styles.receipt}><View style={styles.header}><View><AppText style={styles.brand}>AIRMAX</AppText><AppText style={styles.id}>{invoice.id}</AppText></View><PaymentStatusBadge status={invoice.status} /></View><View style={styles.meta}><AppText style={styles.muted}>Issued {invoice.date}</AppText><AppText style={styles.muted}>Due {invoice.dueDate}</AppText></View>{invoice.items.map(item => <View key={item.id} style={styles.item}><View style={styles.itemCopy}><AppText style={styles.description}>{item.description}</AppText><AppText style={styles.muted}>Qty {item.quantity}</AppText></View><AppText style={styles.value}>{money(item.amount)}</AppText></View>)}<View style={styles.total}><AppText style={styles.totalLabel}>Total</AppText><AppText style={styles.totalValue}>{money(invoice.amount)}</AppText></View></Surface>;
}
export const ReceiptPreview = memo(ReceiptPreviewComponent);
const styles = StyleSheet.create({
  receipt: { gap: spacing.lg }, header: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }, brand: { ...typography.sectionTitle, color: colors.primary }, id: { ...typography.small, color: colors.muted }, meta: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }, muted: { ...typography.small, color: colors.muted }, item: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.border }, itemCopy: { flex: 1 }, description: { ...typography.body, color: colors.text }, value: { ...typography.label, color: colors.text }, total: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.lg }, totalLabel: { ...typography.sectionTitle, color: colors.text }, totalValue: { ...typography.screenTitle, color: colors.primary },
});
