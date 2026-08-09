import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon, AppText, Surface } from '@/components';
import type { AdminCustomerListItem } from '@/services/api/customers.models';
import {
  animation,
  colors,
  fontSizes,
  radius,
  spacing,
  typography,
} from '@/theme';
import { CustomerStatusBadge } from './CustomerStatusBadge';

export function CustomerListItem({
  customer,
  onPress,
}: {
  customer: AdminCustomerListItem;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${customer.name}`}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Surface style={styles.card}>
        <View style={styles.avatar}>
          <AppText style={styles.initial}>
            {customer.name.charAt(0).toUpperCase()}
          </AppText>
        </View>
        <View style={styles.content}>
          <View style={styles.header}>
            <AppText numberOfLines={1} style={styles.name}>
              {customer.name}
            </AppText>
            <CustomerStatusBadge status={customer.status} />
          </View>
          <AppText style={styles.meta}>
            {customer.connectionId ?? 'Connection pending'} · {customer.phone}
          </AppText>
          <AppText numberOfLines={1} style={styles.address}>
            {customer.address ?? 'Service address unavailable'}
          </AppText>
        </View>
        <AppIcon name="chevron-forward" color={colors.muted} size={18} />
      </Surface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: animation.opacity.pressed },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAvatar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: colors.primary,
    fontFamily: typography.screenTitle.fontFamily,
    fontSize: fontSizes.subtitle,
  },
  content: { flex: 1, minWidth: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: {
    ...typography.bodyLarge,
    color: colors.text,
    fontFamily: typography.sectionTitle.fontFamily,
    flex: 1,
  },
  meta: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  address: { ...typography.small, color: colors.muted, marginTop: spacing.xs },
});
