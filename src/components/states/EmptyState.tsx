import { StyleSheet, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';
import { AppIcon, type AppIconName } from '@/components/foundation/AppIcon';
import { AppText } from '@/components/foundation/AppText';
import { SecondaryButton } from '@/components/controls/SecondaryButton';

export function EmptyState({
  title,
  message,
  icon = 'file-tray-outline',
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  icon?: AppIconName;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.state}>
      <View style={styles.icon}>
        <AppIcon name={icon} size={22} color={colors.primary} />
      </View>
      <AppText style={styles.title}>{title}</AppText>
      <AppText style={styles.message}>{message}</AppText>
      {actionLabel && onAction ? (
        <SecondaryButton title={actionLabel} onPress={onAction} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  state: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: `${colors.primary}1A`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.bodyLarge,
    fontFamily: typography.sectionTitle.fontFamily,
    color: colors.text,
  },
  message: { ...typography.body, color: colors.muted, textAlign: 'center' },
});
