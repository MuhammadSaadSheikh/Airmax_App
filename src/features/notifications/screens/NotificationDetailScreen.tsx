import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppHeader,
  AppIcon,
  AppScreen,
  AppText,
  ErrorState,
  PrimaryButton,
  SkeletonCard,
  StatusBadge,
  Surface,
} from '@/components';
import { notificationPresentation } from '@/features/notifications/components/presentation';
import { useNotificationAction } from '@/features/notifications/hooks/useNotificationAction';
import type { CustomerStackParamList } from '@/navigation/types';
import { notificationService } from '@/services/notifications/notificationService';
import type { Notification } from '@/services/notifications/models';
import { queryKeys } from '@/services/query';
import { useAuthStore } from '@/store/auth.store';
import { colors, radius, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<
  CustomerStackParamList,
  'NotificationDetail'
>;

export default function NotificationDetailScreen({ navigation, route }: Props) {
  const queryClient = useQueryClient();
  const performAction = useNotificationAction();
  const user = useAuthStore(state => state.user);
  const connectionId = user?.connectionId ?? 'unknown';
  const viewerId = user?.id ?? connectionId;
  const query = useQuery({
    queryKey: queryKeys.notificationDetail(route.params.id),
    queryFn: () => notificationService.getNotification(route.params.id),
  });
  const readMutation = useMutation({
    mutationFn: () =>
      notificationService.markAsRead(connectionId, route.params.id),
    onSuccess: item => {
      if (!item) return;
      queryClient.setQueryData(queryKeys.notificationDetail(item.id), item);
      queryClient.setQueryData<Notification[]>(
        queryKeys.notifications(viewerId),
        current =>
          current?.map(existing => (existing.id === item.id ? item : existing)),
      );
    },
  });

  useEffect(() => {
    if (query.data && !query.data.isRead && !readMutation.isPending) {
      readMutation.mutate();
    }
  }, [query.data, readMutation]);

  if (query.isPending) {
    return (
      <AppScreen>
        <AppHeader title="Notification detail" showBack />
        <SkeletonCard lines={6} />
      </AppScreen>
    );
  }
  if (query.isError || !query.data) {
    return (
      <AppScreen>
        <AppHeader title="Notification detail" showBack />
        <ErrorState
          title="Notification unavailable"
          message="This update may no longer be available."
          retry={() => void query.refetch()}
        />
      </AppScreen>
    );
  }

  const notification = query.data;
  const presentation = notificationPresentation[notification.type];
  const runAction = () => {
    if (notification.actionType === 'view_details') {
      if (notification.type === 'billing' && notification.targetId) {
        navigation.navigate('InvoiceDetail', { id: notification.targetId });
      } else if (notification.type === 'network') {
        navigation.navigate('Diagnostics');
      }
      return;
    }
    performAction(notification.actionType, notification.targetId);
  };

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <AppHeader
        title="Notification detail"
        subtitle={notification.id}
        showBack
      />
      <Surface style={styles.card}>
        <View
          style={[styles.icon, { backgroundColor: `${presentation.color}1A` }]}
        >
          <AppIcon
            name={presentation.icon}
            size={28}
            color={presentation.color}
          />
        </View>
        <View style={styles.meta}>
          <StatusBadge label={presentation.label} tone="info" />
          {notification.priority !== 'normal' ? (
            <StatusBadge
              label={`${notification.priority} priority`}
              tone={notification.priority === 'critical' ? 'danger' : 'warning'}
            />
          ) : null}
        </View>
        <AppText style={styles.title}>{notification.title}</AppText>
        <AppText style={styles.message}>{notification.message}</AppText>
        <AppText style={styles.time}>
          {new Date(notification.createdAt).toLocaleString('en-GB', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </AppText>
      </Surface>
      <Surface style={styles.privacy}>
        <AppIcon name="shield-checkmark-outline" color={colors.success} />
        <AppText style={styles.privacyText}>
          Sensitive account and payment information is masked in notifications.
        </AppText>
      </Surface>
      {notification.actionLabel && notification.actionType !== 'none' ? (
        <PrimaryButton
          title={notification.actionLabel.toUpperCase()}
          icon="arrow-forward"
          onPress={runAction}
        />
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.huge, gap: spacing.lg },
  card: { gap: spacing.lg },
  icon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { ...typography.screenTitle, color: colors.text },
  message: { ...typography.bodyLarge, color: colors.textSecondary },
  time: { ...typography.small, color: colors.muted },
  privacy: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  privacyText: { ...typography.small, color: colors.textSecondary, flex: 1 },
});
