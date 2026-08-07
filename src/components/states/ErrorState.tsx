import { StyleSheet, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';
import { AppIcon, type AppIconName } from '@/components/foundation/AppIcon';
import { AppText } from '@/components/foundation/AppText';
import { SecondaryButton } from '@/components/controls/SecondaryButton';

export function ErrorState({
  title = 'Couldn’t load this',
  message = 'Check your connection and try again.',
  retry,
  support,
  icon = 'cloud-offline-outline',
}: {
  title?: string;
  message?: string;
  retry?: () => void;
  support?: () => void;
  icon?: AppIconName;
}) {
  return (
    <View style={styles.state}>
      <View style={styles.icon}>
        <AppIcon name={icon} size={22} color={colors.danger} />
      </View>
      <AppText style={styles.title}>{title}</AppText>
      <AppText style={styles.message}>{message}</AppText>
      {retry ? <SecondaryButton title="Try again" onPress={retry} /> : null}
      {support ? (
        <SecondaryButton title="Contact support" onPress={support} />
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

export const NetworkErrorState = (
  props: Pick<React.ComponentProps<typeof ErrorState>, 'retry' | 'support'>,
) => (
  <ErrorState
    title="Internet unavailable"
    message="Check your connection and try again."
    {...props}
  />
);

export const ServerErrorState = (
  props: Pick<React.ComponentProps<typeof ErrorState>, 'retry' | 'support'>,
) => (
  <ErrorState
    title="Service unavailable"
    message="AIRMAX is having trouble responding. Please try again shortly."
    icon="server-outline"
    {...props}
  />
);

export const OfflineState = (
  props: Pick<React.ComponentProps<typeof ErrorState>, 'retry' | 'support'>,
) => (
  <ErrorState
    title="You’re offline"
    message="Reconnect to continue using live AIRMAX services."
    {...props}
  />
);

export const PermissionErrorState = (
  props: Pick<React.ComponentProps<typeof ErrorState>, 'retry' | 'support'>,
) => (
  <ErrorState
    title="Permission needed"
    message="Allow access in your device settings to continue."
    icon="lock-closed-outline"
    {...props}
  />
);
