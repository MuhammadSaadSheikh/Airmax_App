import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  AppHeader,
  AppIcon,
  AppScreen,
  AppText,
  ErrorState,
  NotificationSkeleton,
} from '@/components';
import { environment } from '@/config/environment';
import {
  NotificationBadge,
  NotificationCard,
  NotificationEmptyState,
  NotificationFilter,
  RecommendationCard,
  SmartSuggestionCard,
  type NotificationFilterValue,
} from '@/features/notifications/components';
import { useNotificationAction } from '@/features/notifications/hooks/useNotificationAction';
import { useCustomerNavigation } from '@/navigation';
import { notificationService } from '@/services/notifications/notificationService';
import { personalizationService } from '@/services/notifications/personalizationService';
import type { Notification } from '@/services/notifications/models';
import { queryKeys } from '@/services/query';
import { useAuthStore } from '@/store/auth.store';
import { animation, colors, radius, spacing, typography } from '@/theme';

export default function NotificationCenterScreen() {
  const navigation = useCustomerNavigation();
  const performAction = useNotificationAction();
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);
  const connectionId = user?.connectionId ?? 'unknown';
  const viewerId = user?.id ?? connectionId;
  const [filter, setFilter] = useState<NotificationFilterValue>('all');
  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications(viewerId),
    queryFn: () => notificationService.getNotifications(connectionId),
    staleTime: 30_000,
  });
  const recommendationsQuery = useQuery({
    queryKey: queryKeys.recommendations(connectionId),
    queryFn: () => personalizationService.getRecommendations(connectionId),
    enabled: environment.useMockApi,
    staleTime: 60_000,
  });
  const insightQuery = useQuery({
    queryKey: [...queryKeys.recommendations(connectionId), 'insight'],
    queryFn: () => personalizationService.getCustomerInsight(connectionId),
    enabled: environment.useMockApi,
    staleTime: 60_000,
  });
  const readMutation = useMutation({
    mutationFn: (id: string) =>
      notificationService.markAsRead(connectionId, id),
    onSuccess: item => {
      if (!item) return;
      queryClient.setQueryData<Notification[]>(
        queryKeys.notifications(viewerId),
        current =>
          current?.map(existing => (existing.id === item.id ? item : existing)),
      );
      queryClient.setQueryData(queryKeys.notificationDetail(item.id), item);
    },
  });
  const allReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(connectionId),
    onSuccess: () => {
      queryClient.setQueryData<Notification[]>(
        queryKeys.notifications(viewerId),
        current => current?.map(item => ({ ...item, isRead: true })),
      );
    },
  });
  const notifications = useMemo(
    () => notificationsQuery.data ?? [],
    [notificationsQuery.data],
  );
  const unread = notifications.filter(item => !item.isRead).length;
  const filtered = useMemo(
    () =>
      filter === 'all'
        ? notifications
        : notifications.filter(item => item.type === filter),
    [filter, notifications],
  );

  const markRead = useCallback(
    (item: Notification) => {
      if (!item.isRead) readMutation.mutate(item.id);
    },
    [readMutation],
  );
  const openDetail = useCallback(
    (item: Notification) => {
      markRead(item);
      navigation.navigate('NotificationDetail', { id: item.id });
    },
    [markRead, navigation],
  );
  const runAction = useCallback(
    (item: Notification) => {
      markRead(item);
      if (item.actionType === 'view_details') {
        navigation.navigate('NotificationDetail', { id: item.id });
      } else {
        performAction(item.actionType, item.targetId);
      }
    },
    [markRead, navigation, performAction],
  );
  const renderItem = useCallback(
    ({ item, index }: { item: Notification; index: number }) => (
      <NotificationCard
        notification={item}
        index={index}
        onPress={() => openDetail(item)}
        onAction={() => runAction(item)}
      />
    ),
    [openDetail, runAction],
  );

  if (notificationsQuery.isPending) {
    return (
      <AppScreen scroll={false} contentContainerStyle={styles.screen}>
        <AppHeader
          title="Notifications"
          subtitle="Personalized AIRMAX updates"
          showBack
        />
        <NotificationSkeleton />
      </AppScreen>
    );
  }

  if (notificationsQuery.isError) {
    return (
      <AppScreen>
        <AppHeader title="Notifications" showBack />
        <ErrorState
          title="Notifications unavailable"
          message="We couldn't load your communication center."
          retry={() => void notificationsQuery.refetch()}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen scroll={false} contentContainerStyle={styles.screen}>
      <AppHeader
        title="Notifications"
        subtitle={`${unread} unread · AIRMAX updates`}
        showBack
        action={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notification settings"
            onPress={() => navigation.navigate('NotificationSettings')}
            style={({ pressed }) => [
              styles.settings,
              pressed && styles.pressed,
            ]}
          >
            <AppIcon name="settings-outline" size={21} />
            <NotificationBadge count={unread} />
          </Pressable>
        }
      />
      <NotificationFilter value={filter} onChange={setFilter} />
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={NotificationSeparator}
        ListEmptyComponent={
          <NotificationEmptyState filtered={filter !== 'all'} />
        }
        ListHeaderComponent={
          filter === 'all' ? (
            <View style={styles.headerContent}>
              {environment.useMockApi && recommendationsQuery.data?.length ? (
                <>
                  <AppText style={styles.sectionTitle}>
                    Recommended actions
                  </AppText>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.recommendations}
                  >
                    {recommendationsQuery.data.map((recommendation, index) => (
                      <RecommendationCard
                        key={recommendation.id}
                        recommendation={recommendation}
                        index={index}
                        onPress={() =>
                          navigation.navigate('RecommendationDetail', {
                            id: recommendation.id,
                          })
                        }
                      />
                    ))}
                  </ScrollView>
                </>
              ) : null}
              {environment.useMockApi && insightQuery.data ? (
                <SmartSuggestionCard insight={insightQuery.data} />
              ) : null}
              <View style={styles.listHeader}>
                <AppText style={styles.sectionTitle}>Latest updates</AppText>
                {unread > 0 && notificationService.supportsMarkAllAsRead ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Mark all notifications as read"
                    disabled={allReadMutation.isPending}
                    onPress={() => allReadMutation.mutate()}
                    hitSlop={8}
                  >
                    <AppText style={styles.markRead}>Mark all read</AppText>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ) : null
        }
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={9}
        removeClippedSubviews
        showsVerticalScrollIndicator={false}
      />
    </AppScreen>
  );
}

function NotificationSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingBottom: spacing.none },
  settings: {
    minWidth: 46,
    minHeight: 46,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { flexGrow: 1, paddingTop: spacing.lg, paddingBottom: spacing.huge },
  headerContent: { gap: spacing.lg, paddingBottom: spacing.lg },
  recommendations: { gap: spacing.md },
  sectionTitle: { ...typography.sectionTitle, color: colors.text },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  markRead: {
    ...typography.label,
    color: colors.primary,
    paddingVertical: spacing.sm,
  },
  separator: { height: spacing.md },
  pressed: { opacity: animation.opacity.pressed },
});
