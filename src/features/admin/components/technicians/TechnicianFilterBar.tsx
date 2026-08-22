import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText, SearchField } from '@/components';
import type {
  TechnicianArea,
  TechnicianStatus,
} from '@/services/api/technicians.models';
import { animation, colors, radius, spacing, typography } from '@/theme';

export type TechnicianStatusFilter = TechnicianStatus | 'ALL';
export type TechnicianAreaFilter = string | 'ALL';

const statuses: ReadonlyArray<{
  value: TechnicianStatusFilter;
  label: string;
}> = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'BUSY', label: 'Busy' },
  { value: 'OFFLINE', label: 'Offline' },
  { value: 'ON_LEAVE', label: 'On leave' },
];

function FilterChip({
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
        selected && styles.selectedChip,
        pressed && styles.pressed,
      ]}
    >
      <AppText style={[styles.chipLabel, selected && styles.selectedLabel]}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function TechnicianFilterBar({
  search,
  status,
  area,
  areas,
  onSearchChange,
  onStatusChange,
  onAreaChange,
}: {
  search: string;
  status: TechnicianStatusFilter;
  area: TechnicianAreaFilter;
  areas: TechnicianArea[];
  onSearchChange: (value: string) => void;
  onStatusChange: (value: TechnicianStatusFilter) => void;
  onAreaChange: (value: TechnicianAreaFilter) => void;
}) {
  return (
    <View style={styles.container}>
      <SearchField
        accessibilityLabel="Search technicians"
        value={search}
        onChangeText={onSearchChange}
        placeholder="Search name, area or skill"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {statuses.map(item => (
          <FilterChip
            key={item.value}
            label={item.label}
            accessibilityLabel={`Filter technicians by status ${item.label}`}
            selected={status === item.value}
            onPress={() => onStatusChange(item.value)}
          />
        ))}
      </ScrollView>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        <FilterChip
          label="All areas"
          accessibilityLabel="Filter technicians by all areas"
          selected={area === 'ALL'}
          onPress={() => onAreaChange('ALL')}
        />
        {areas.map(item => (
          <FilterChip
            key={item.id}
            label={item.name}
            accessibilityLabel={`Filter technicians by area ${item.name}`}
            selected={area === item.id}
            onPress={() => onAreaChange(item.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm, marginBottom: spacing.lg },
  row: { gap: spacing.sm, paddingRight: spacing.lg },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  selectedChip: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  pressed: { opacity: animation.opacity.pressed },
  chipLabel: { ...typography.label, color: colors.muted },
  selectedLabel: { color: colors.textOnAccent },
});
