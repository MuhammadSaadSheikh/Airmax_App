import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import {
  AppHeader,
  AppIcon,
  AppScreen,
  AppText,
  ErrorState,
  PrimaryButton,
  SkeletonCard,
  Surface,
} from '@/components';
import { PreferenceToggle } from '@/features/notifications/components';
import type { CustomerStackParamList } from '@/navigation/types';
import { notificationService } from '@/services/notifications/notificationService';
import type { NotificationPreference } from '@/services/notifications/models';
import { queryKeys } from '@/services/query';
import { useAuthStore } from '@/store/auth.store';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<
  CustomerStackParamList,
  'NotificationSettings'
>;

const initialPreferences: NotificationPreference = {
  billingEnabled: true,
  networkEnabled: true,
  supportEnabled: true,
  offersEnabled: false,
  packageRecommendationsEnabled: true,
  pushEnabled: true,
};

export default function NotificationSettingsScreen({ navigation }: Props) {
  const queryClient = useQueryClient();
  const connectionId = useAuthStore(
    state => state.user?.connectionId ?? 'unknown',
  );
  const [overrides, setOverrides] = useState<Partial<NotificationPreference>>(
    {},
  );
  const query = useQuery({
    queryKey: queryKeys.notificationPreferences(connectionId),
    queryFn: () => notificationService.getPreferences(connectionId),
    enabled: notificationService.supportsPreferences,
  });
  const preferences = { ...(query.data ?? initialPreferences), ...overrides };
  const mutation = useMutation({
    mutationFn: () =>
      notificationService.updatePreferences(connectionId, preferences),
    onSuccess: saved => {
      queryClient.setQueryData(
        queryKeys.notificationPreferences(connectionId),
        saved,
      );
      Alert.alert(
        'Preferences saved',
        'Your notification choices have been updated.',
        [{ text: 'Done', onPress: () => navigation.goBack() }],
      );
    },
    onError: () =>
      Alert.alert('Unable to save', 'Please try again in a moment.'),
  });

  const update = (key: keyof NotificationPreference, value: boolean) =>
    setOverrides(current => ({ ...current, [key]: value }));

  if (!notificationService.supportsPreferences) {
    return (
      <AppScreen>
        <AppHeader title="Notification settings" showBack />
        <ErrorState
          title="Settings not available"
          message="Notification preferences will be available after a production backend contract is introduced."
        />
      </AppScreen>
    );
  }

  if (query.isPending) {
    return (
      <AppScreen>
        <AppHeader title="Notification settings" showBack />
        <SkeletonCard lines={7} />
      </AppScreen>
    );
  }
  if (query.isError) {
    return (
      <AppScreen>
        <AppHeader title="Notification settings" showBack />
        <ErrorState
          title="Settings unavailable"
          message="We couldn't load your notification preferences."
          retry={() => void query.refetch()}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <AppHeader
        title="Notification settings"
        subtitle="Choose what reaches you"
        showBack
      />
      <Surface style={styles.preferences}>
        <PreferenceToggle
          icon="receipt-outline"
          title="Billing alerts"
          description="Invoices, due dates and payment confirmations"
          value={preferences.billingEnabled}
          onValueChange={value => update('billingEnabled', value)}
        />
        <Divider />
        <PreferenceToggle
          icon="wifi-outline"
          title="Network alerts"
          description="Maintenance, outages and restoration updates"
          value={preferences.networkEnabled}
          onValueChange={value => update('networkEnabled', value)}
        />
        <Divider />
        <PreferenceToggle
          icon="headset-outline"
          title="Support updates"
          description="Ticket and technician progress"
          value={preferences.supportEnabled}
          onValueChange={value => update('supportEnabled', value)}
        />
        <Divider />
        <PreferenceToggle
          icon="gift-outline"
          title="Marketing offers"
          description="AIRMAX promotions and rewards"
          value={preferences.offersEnabled}
          onValueChange={value => update('offersEnabled', value)}
        />
        <Divider />
        <PreferenceToggle
          icon="sparkles-outline"
          title="Package recommendations"
          description="Suggestions based on connection usage"
          value={preferences.packageRecommendationsEnabled}
          onValueChange={value =>
            update('packageRecommendationsEnabled', value)
          }
        />
        <Divider />
        <PreferenceToggle
          icon="notifications-outline"
          title="Push notifications"
          description="Allow device alerts through FCM or APNs"
          value={preferences.pushEnabled}
          onValueChange={value => update('pushEnabled', value)}
        />
      </Surface>
      <View style={styles.security}>
        <AppIcon name="lock-closed-outline" color={colors.success} />
        <View style={styles.securityCopy}>
          <AppText style={styles.securityTitle}>Privacy protected</AppText>
          <AppText style={styles.securityText}>
            Preference storage contains no notification content, payment details
            or personal messages.
          </AppText>
        </View>
      </View>
      <PrimaryButton
        title="SAVE PREFERENCES"
        icon="checkmark-circle-outline"
        loading={mutation.isPending}
        onPress={() => mutation.mutate()}
      />
    </AppScreen>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.huge, gap: spacing.lg },
  preferences: { paddingVertical: spacing.sm },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  security: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  securityCopy: { flex: 1 },
  securityTitle: { ...typography.label, color: colors.success },
  securityText: {
    ...typography.small,
    color: colors.muted,
    marginTop: spacing.xs,
  },
});
