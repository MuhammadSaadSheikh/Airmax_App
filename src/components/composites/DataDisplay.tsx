import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
import { AppIcon, type AppIconName } from '@/components/foundation/AppIcon';
import { AppText } from '@/components/foundation/AppText';
import { Surface } from '@/components/foundation/Surface';

export function IconTile({
  icon,
  color = colors.primary,
}: {
  icon: AppIconName;
  color?: string;
}) {
  return (
    <View style={[styles.iconTile, { backgroundColor: `${color}1A` }]}>
      <AppIcon name={icon} size={22} color={color} />
    </View>
  );
}

export function Row({
  icon,
  title,
  subtitle,
  onPress,
  right,
}: {
  icon: AppIconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <IconTile icon={icon} />
      <View style={styles.copy}>
        <AppText style={styles.rowTitle}>{title}</AppText>
        {subtitle ? (
          <AppText style={styles.rowSubtitle}>{subtitle}</AppText>
        ) : null}
      </View>
      {right ??
        (onPress ? (
          <AppIcon name="chevron-forward" size={19} color={colors.muted} />
        ) : null)}
    </Pressable>
  );
}

export function StatCard({
  icon,
  label,
  value,
  color = colors.primary,
  change,
}: {
  icon: AppIconName;
  label: string;
  value: string;
  color?: string;
  change?: string;
}) {
  return (
    <Surface style={styles.stat}>
      <IconTile icon={icon} color={color} />
      <AppText style={styles.statValue}>{value}</AppText>
      <AppText style={styles.statLabel}>{label}</AppText>
      {change ? <AppText style={styles.change}>{change}</AppText> : null}
    </Surface>
  );
}

const styles = StyleSheet.create({
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  pressed: { opacity: 0.7 },
  copy: { flex: 1 },
  rowTitle: {
    ...typography.bodyLarge,
    fontFamily: typography.sectionTitle.fontFamily,
    color: colors.text,
  },
  rowSubtitle: {
    ...typography.small,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  stat: { flex: 1, minWidth: '46%' },
  statValue: {
    color: colors.text,
    fontSize: 22,
    fontFamily: typography.sectionTitle.fontFamily,
    marginTop: spacing.md,
  },
  statLabel: {
    ...typography.small,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  change: { color: colors.success, fontSize: 11, marginTop: spacing.xs + 1 },
});
