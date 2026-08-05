import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppIcon, AppText, Surface } from '@/components';
import type { Invoice } from '@/services/billing';
import { animation, colors, money, spacing, typography } from '@/theme';
import { PaymentStatusBadge } from './PaymentStatusBadge';

function InvoiceCardComponent({ invoice, onPress, delay = 0 }: { invoice: Invoice; onPress: () => void; delay?: number }) {
  return <Animated.View entering={FadeInDown.delay(delay).duration(animation.duration.normal)}><Pressable accessibilityRole="button" accessibilityLabel={`Invoice ${invoice.id}`} onPress={onPress} style={({ pressed }) => pressed && styles.pressed}><Surface style={styles.card}><View style={styles.icon}><AppIcon name="document-text-outline" color={invoice.status === 'paid' ? colors.success : colors.warning} size={22} /></View><View style={styles.copy}><AppText style={styles.id}>{invoice.id}</AppText><AppText style={styles.date}>Issued {invoice.date} · Due {invoice.dueDate}</AppText></View><View style={styles.right}><AppText style={styles.amount}>{money(invoice.amount)}</AppText><PaymentStatusBadge status={invoice.status} /></View></Surface></Pressable></Animated.View>;
}
export const InvoiceCard = memo(InvoiceCardComponent);
const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  icon: { padding: spacing.sm }, copy: { flex: 1 }, id: { ...typography.label, color: colors.text }, date: { ...typography.small, color: colors.muted, marginTop: spacing.xs }, right: { alignItems: 'flex-end', gap: spacing.xs }, amount: { ...typography.label, color: colors.text }, pressed: { opacity: animation.opacity.pressed },
});
