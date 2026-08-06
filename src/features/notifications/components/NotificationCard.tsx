import { memo, useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeInDown,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { AppIcon, AppText } from '@/components';
import type { Notification } from '@/services/notifications/models';
import { animation, colors, radius, spacing, typography } from '@/theme';
import { notificationPresentation, priorityColor } from './presentation';

type Props = {
  notification: Notification;
  index?: number;
  onPress: () => void;
  onAction?: () => void;
};

const timeLabel = (createdAt: string) => {
  const date = new Date(createdAt);
  return Number.isNaN(date.getTime())
    ? createdAt
    : date.toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      });
};

function NotificationCardView({
  notification,
  index = 0,
  onPress,
  onAction,
}: Props) {
  const readProgress = useSharedValue(notification.isRead ? 1 : 0);
  useEffect(() => {
    readProgress.value = withTiming(notification.isRead ? 1 : 0, {
      duration: animation.duration.normal,
    });
  }, [notification.isRead, readProgress]);
  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      readProgress.value,
      [0, 1],
      [colors.surfaceElevated, colors.surface],
    ),
    borderColor: interpolateColor(
      readProgress.value,
      [0, 1],
      [colors.borderStrong, colors.border],
    ),
  }));
  const presentation = notificationPresentation[notification.type];

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(
        animation.duration.normal,
      )}
      style={[styles.card, animatedStyle]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${notification.isRead ? 'Read' : 'Unread'} ${presentation.label} notification. ${notification.title}`}
        onPress={onPress}
        style={({ pressed }) => [styles.content, pressed && styles.pressed]}
      >
        <View
          style={[
            styles.priority,
            { backgroundColor: priorityColor[notification.priority] },
          ]}
        />
        <View
          style={[styles.icon, { backgroundColor: `${presentation.color}1A` }]}
        >
          <AppIcon
            name={presentation.icon}
            size={22}
            color={presentation.color}
          />
        </View>
        <View style={styles.copy}>
          <View style={styles.metaRow}>
            <AppText style={[styles.type, { color: presentation.color }]}>
              {presentation.label.toUpperCase()}
            </AppText>
            {!notification.isRead ? <View style={styles.unreadDot} /> : null}
            <AppText style={styles.time}>
              {timeLabel(notification.createdAt)}
            </AppText>
          </View>
          <AppText style={styles.title}>{notification.title}</AppText>
          <AppText style={styles.message} numberOfLines={3}>
            {notification.message}
          </AppText>
          {notification.actionLabel && onAction ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={notification.actionLabel}
              hitSlop={8}
              onPress={event => {
                event.stopPropagation();
                onAction();
              }}
              style={({ pressed }) => [
                styles.action,
                pressed && styles.pressed,
              ]}
            >
              <AppText style={styles.actionLabel}>
                {notification.actionLabel}
              </AppText>
              <AppIcon name="arrow-forward" size={16} color={colors.primary} />
            </Pressable>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export const NotificationCard = memo(NotificationCardView);

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  content: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg },
  priority: { width: 3, alignSelf: 'stretch', borderRadius: radius.pill },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  type: { ...typography.small, fontFamily: typography.label.fontFamily },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  time: { ...typography.small, color: colors.muted, marginLeft: 'auto' },
  title: { ...typography.label, color: colors.text, marginTop: spacing.sm },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  action: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  actionLabel: { ...typography.label, color: colors.primary },
  pressed: { opacity: animation.opacity.pressed },
});
