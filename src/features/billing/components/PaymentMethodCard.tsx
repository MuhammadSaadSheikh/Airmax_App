import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon, AppText, type AppIconName } from '@/components';
import type { PaymentMethod } from '@/services/billing';
import { animation, colors, radius, spacing, typography } from '@/theme';

const icons: Record<PaymentMethod['type'], AppIconName> = { card: 'card-outline', wallet: 'wallet-outline', bank: 'business-outline' };
function PaymentMethodCardComponent({ method, selected, onPress }: { method: PaymentMethod; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [styles.card, selected && styles.selected, pressed && styles.pressed]}><View style={styles.icon}><AppIcon name={icons[method.type]} color={selected ? colors.primary : colors.muted} size={23} /></View><View style={styles.copy}><View style={styles.nameRow}><AppText style={styles.name}>{method.name}</AppText>{method.isDefault ? <AppText style={styles.defaultText}>DEFAULT</AppText> : null}</View><AppText style={styles.detail}>{method.detail}</AppText></View><AppIcon name={selected ? 'radio-button-on' : 'radio-button-off'} color={selected ? colors.primary : colors.muted} size={21} /></Pressable>;
}
export const PaymentMethodCard = memo(PaymentMethodCardComponent);
const styles = StyleSheet.create({
  card: { minHeight: spacing.huge * 2, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
  selected: { borderColor: colors.primary, backgroundColor: colors.surfaceSelected }, pressed: { opacity: animation.opacity.pressed }, icon: { width: spacing.huge, alignItems: 'center' }, copy: { flex: 1 }, nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, name: { ...typography.label, color: colors.text }, defaultText: { ...typography.small, color: colors.primary }, detail: { ...typography.small, color: colors.muted },
});
