import { StyleSheet, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';
import { AppIcon } from '@/components/foundation/AppIcon';
import { AppText } from '@/components/foundation/AppText';
import { SecondaryButton } from '@/components/controls/SecondaryButton';

export function ErrorState({
  title = 'Couldn’t load this',
  message = 'Check your connection and try again.',
  retry,
}: {
  title?: string;
  message?: string;
  retry?: () => void;
}) {
  return (
    <View style={styles.state}>
      <View style={styles.icon}>
        <AppIcon name="cloud-offline-outline" size={22} color={colors.danger} />
      </View>
      <AppText style={styles.title}>{title}</AppText>
      <AppText style={styles.message}>{message}</AppText>
      {retry ? <SecondaryButton title="Try again" onPress={retry} /> : null}
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
    backgroundColor: `${colors.danger}1A`,
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
