import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText, SearchField } from '@/components';
import type { AuditAction, AuditEntityType } from '@/services/api/audit.models';
import { animation, colors, radius, spacing, typography } from '@/theme';

const entityOptions: AuditEntityType[] = [
  'INVOICE',
  'PAYMENT',
  'PACKAGE',
  'SUBSCRIPTION',
  'COMPLAINT',
  'WORK_ORDER',
];
const actionOptions: AuditAction[] = [
  'INVOICE_CANCELLED',
  'PAYMENT_RECORDED',
  'PACKAGE_DEACTIVATED',
  'SUBSCRIPTION_SUSPENDED',
  'SUBSCRIPTION_CANCELLED',
  'COMPLAINT_TECHNICIAN_REASSIGNED',
  'WORK_ORDER_ACCEPTED',
  'WORK_ORDER_STARTED',
  'WORK_ORDER_COMPLETED',
  'WORK_ORDER_CANCELLED',
];

function Chip({
  label,
  accessibilityLabel,
  selected,
  onPress,
}: {
  label: string;
  accessibilityLabel: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <AppText style={[styles.chipLabel, selected && styles.selectedLabel]}>
        {label.replaceAll('_', ' ')}
      </AppText>
    </Pressable>
  );
}

export function AuditFilterBar({
  search,
  entityType,
  action,
  onSearchChange,
  onEntityTypeChange,
  onActionChange,
}: {
  search: string;
  entityType?: AuditEntityType;
  action?: AuditAction;
  onSearchChange: (value: string) => void;
  onEntityTypeChange: (value?: AuditEntityType) => void;
  onActionChange: (value?: AuditAction) => void;
}) {
  return (
    <View>
      <SearchField
        accessibilityLabel="Search audit events"
        value={search}
        onChangeText={onSearchChange}
        placeholder="Search actor, entity or metadata"
      />
      <AppText style={styles.label}>Entity</AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.options}
      >
        <Chip
          label="All"
          accessibilityLabel="Filter audit events by all entities"
          selected={!entityType}
          onPress={() => onEntityTypeChange(undefined)}
        />
        {entityOptions.map(option => (
          <Chip
            key={option}
            label={option}
            accessibilityLabel={`Filter audit events by entity ${option}`}
            selected={entityType === option}
            onPress={() => onEntityTypeChange(option)}
          />
        ))}
      </ScrollView>
      <AppText style={styles.label}>Action</AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.options}
      >
        <Chip
          label="All"
          accessibilityLabel="Filter audit events by all actions"
          selected={!action}
          onPress={() => onActionChange(undefined)}
        />
        {actionOptions.map(option => (
          <Chip
            key={option}
            label={option}
            accessibilityLabel={`Filter audit events by action ${option.replaceAll('_', ' ')}`}
            selected={action === option}
            onPress={() => onActionChange(option)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  options: { gap: spacing.sm, paddingBottom: spacing.lg },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceSelected,
  },
  chipLabel: { ...typography.small, color: colors.muted },
  selectedLabel: { color: colors.primary },
  pressed: { opacity: animation.opacity.pressed },
});
