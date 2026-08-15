import { StyleSheet } from 'react-native';
import { AppText, Button, Surface } from '@/components';
import type { SubscriptionStatus } from '@/services/api/subscriptions.models';
import { colors, spacing, typography } from '@/theme';

export function SubscriptionActionPanel({
  status,
  loading,
  onActivate,
  onSuspend,
  onCancel,
  onChangePackage,
}: {
  status: SubscriptionStatus;
  loading: boolean;
  onActivate: () => void;
  onSuspend: () => void;
  onCancel: () => void;
  onChangePackage: () => void;
}) {
  return (
    <Surface loading={loading}>
      {status === 'active' ? (
        <>
          <Button
            title="Change package"
            icon="swap-horizontal-outline"
            variant="secondary"
            disabled={loading}
            onPress={onChangePackage}
          />
          <Button
            title="Suspend subscription"
            icon="pause-circle-outline"
            variant="danger"
            loading={loading}
            onPress={onSuspend}
          />
        </>
      ) : null}
      {status === 'suspended' ? (
        <>
          <Button
            title="Activate subscription"
            icon="play-circle-outline"
            loading={loading}
            onPress={onActivate}
          />
          <Button
            title="Cancel subscription"
            icon="close-circle-outline"
            variant="danger"
            disabled={loading}
            onPress={onCancel}
          />
        </>
      ) : null}
      {status === 'pending' ? (
        <Button
          title="Activate subscription"
          icon="play-circle-outline"
          loading={loading}
          onPress={onActivate}
        />
      ) : null}
      {status === 'expired' ? (
        <>
          <Button
            title="Renew subscription"
            icon="refresh-circle-outline"
            disabled
          />
          <AppText style={styles.help}>
            Renewal will be available when billing management is implemented.
          </AppText>
        </>
      ) : null}
      {status === 'cancelled' ? (
        <AppText style={styles.help}>
          Cancelled subscriptions are read only.
        </AppText>
      ) : null}
    </Surface>
  );
}

const styles = StyleSheet.create({
  help: {
    ...typography.body,
    color: colors.textSecondary,
    marginVertical: spacing.sm,
  },
});
