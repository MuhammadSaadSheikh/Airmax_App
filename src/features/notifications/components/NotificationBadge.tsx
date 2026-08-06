import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components';
import { colors, radius, spacing, typography } from '@/theme';

export function NotificationBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  const label = count > 99 ? '99+' : String(count);
  return (
    <View
      accessibilityLabel={`${count} unread notifications`}
      style={styles.badge}
    >
      <AppText style={styles.label}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
  },
  label: {
    ...typography.small,
    color: colors.text,
    fontFamily: typography.label.fontFamily,
    fontSize: 10,
  },
});
