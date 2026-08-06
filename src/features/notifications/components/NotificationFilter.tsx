import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { AppText } from '@/components';
import type { NotificationType } from '@/services/notifications/models';
import { animation, colors, radius, spacing, typography } from '@/theme';

export type NotificationFilterValue = 'all' | NotificationType;

const filters: { id: NotificationFilterValue; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'billing', label: 'Billing' },
  { id: 'network', label: 'Network' },
  { id: 'support', label: 'Support' },
  { id: 'offers', label: 'Offers' },
];

export function NotificationFilter({
  value,
  onChange,
}: {
  value: NotificationFilterValue;
  onChange: (value: NotificationFilterValue) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filters}
      accessibilityRole="tablist"
    >
      {filters.map(filter => {
        const selected = filter.id === value;
        return (
          <Pressable
            key={filter.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(filter.id)}
            style={({ pressed }) => [
              styles.filter,
              selected && styles.selected,
              pressed && styles.pressed,
            ]}
          >
            <AppText style={[styles.label, selected && styles.selectedLabel]}>
              {filter.label}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  filters: { gap: spacing.sm, paddingVertical: spacing.xs },
  filter: {
    minHeight: 42,
    minWidth: 62,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceAccent,
  },
  label: { ...typography.label, color: colors.muted },
  selectedLabel: { color: colors.primary },
  pressed: { opacity: animation.opacity.pressed },
});
