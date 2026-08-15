import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText, SearchField } from '@/components';
import type { SubscriptionStatusFilter } from '@/services/api/subscriptions.models';
import { animation, colors, radius, spacing, typography } from '@/theme';

const filters: ReadonlyArray<{
  value: SubscriptionStatusFilter;
  label: string;
}> = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function SubscriptionFilterBar({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: {
  search: string;
  status: SubscriptionStatusFilter;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: SubscriptionStatusFilter) => void;
}) {
  return (
    <View style={styles.container}>
      <SearchField
        value={search}
        onChangeText={onSearchChange}
        placeholder="Search ID, customer, connection or package"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {filters.map(filter => {
          const selected = status === filter.value;
          return (
            <Pressable
              key={filter.value}
              accessibilityRole="button"
              accessibilityLabel={`Filter subscriptions by ${filter.label}`}
              accessibilityState={{ selected }}
              onPress={() => onStatusChange(filter.value)}
              style={({ pressed }) => [
                styles.filter,
                selected && styles.selectedFilter,
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  filters: { gap: spacing.sm, paddingRight: spacing.lg },
  filter: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selectedFilter: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  pressed: { opacity: animation.opacity.pressed },
  label: { ...typography.label, color: colors.muted },
  selectedLabel: { color: colors.textOnAccent },
});
