import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppIcon, AppText } from '@/components';
import type { ComplaintTimeline as TimelineItem } from '@/services/support';
import { animation, colors, radius, spacing, typography } from '@/theme';

export function ComplaintTimeline({ items }: { items: TimelineItem[] }) {
  return (
    <View accessibilityRole="list" style={styles.list}>
      {items.map((item, index) => (
        <Animated.View
          key={item.status}
          entering={FadeInDown.delay(
            index * animation.duration.instant,
          ).duration(animation.duration.normal)}
          style={styles.item}
          accessibilityLabel={`${item.status.replaceAll('_', ' ')}. ${item.completed ? 'Completed' : 'Pending'}`}
        >
          <View style={styles.rail}>
            <View
              style={[styles.marker, item.completed && styles.markerComplete]}
            >
              <AppIcon
                name={item.completed ? 'checkmark' : 'ellipse-outline'}
                size={14}
                color={item.completed ? colors.textOnAccent : colors.muted}
              />
            </View>
            {index < items.length - 1 ? (
              <View
                style={[styles.line, item.completed && styles.lineComplete]}
              />
            ) : null}
          </View>
          <View style={styles.copy}>
            <AppText style={[styles.title, !item.completed && styles.pending]}>
              {item.status.replaceAll('_', ' ')}
            </AppText>
            <AppText style={styles.description}>{item.description}</AppText>
            {item.timestamp ? (
              <AppText style={styles.timestamp}>{item.timestamp}</AppText>
            ) : null}
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.none },
  item: { flexDirection: 'row', minHeight: 88, gap: spacing.md },
  rail: { width: 28, alignItems: 'center' },
  marker: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerComplete: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  line: { width: 2, flex: 1, backgroundColor: colors.border },
  lineComplete: { backgroundColor: colors.primary },
  copy: { flex: 1, paddingBottom: spacing.lg },
  title: {
    ...typography.label,
    color: colors.text,
    textTransform: 'capitalize',
  },
  pending: { color: colors.muted },
  description: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  timestamp: {
    ...typography.small,
    color: colors.muted,
    marginTop: spacing.xs,
  },
});
