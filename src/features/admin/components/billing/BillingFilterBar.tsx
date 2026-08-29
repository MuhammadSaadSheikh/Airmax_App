import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText, SearchField } from '@/components';
import type {
  InvoiceStatusFilter,
  PaymentStatusFilter,
} from '@/services/api/billing.models';
import { animation, colors, radius, spacing, typography } from '@/theme';

const invoiceFilters: ReadonlyArray<{
  value: InvoiceStatusFilter;
  label: string;
}> = [
  { value: 'all', label: 'All invoices' },
  { value: 'generated', label: 'Generated' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
];

const paymentFilters: ReadonlyArray<{
  value: PaymentStatusFilter;
  label: string;
}> = [
  { value: 'all', label: 'All payments' },
  { value: 'no_payment', label: 'No attempt' },
  { value: 'successful', label: 'Successful' },
  { value: 'pending', label: 'Processing' },
  { value: 'failed', label: 'Failed' },
];

function FilterGroup<T extends string>({
  label,
  filters,
  selected,
  onChange,
}: {
  label: string;
  filters: ReadonlyArray<{ value: T; label: string }>;
  selected: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.group}>
      <AppText style={styles.groupLabel}>{label}</AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {filters.map(filter => {
          const isSelected = selected === filter.value;
          return (
            <Pressable
              key={filter.value}
              accessibilityRole="button"
              accessibilityLabel={`${label}: ${filter.label}`}
              accessibilityState={{ selected: isSelected }}
              onPress={() => onChange(filter.value)}
              style={({ pressed }) => [
                styles.filter,
                isSelected && styles.selectedFilter,
                pressed && styles.pressed,
              ]}
            >
              <AppText
                style={[styles.filterLabel, isSelected && styles.selectedLabel]}
              >
                {filter.label}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function BillingFilterBar({
  search,
  invoiceStatus,
  paymentStatus,
  onSearchChange,
  onInvoiceStatusChange,
  onPaymentStatusChange,
}: {
  search: string;
  invoiceStatus: InvoiceStatusFilter;
  paymentStatus: PaymentStatusFilter;
  onSearchChange: (value: string) => void;
  onInvoiceStatusChange: (value: InvoiceStatusFilter) => void;
  onPaymentStatusChange: (value: PaymentStatusFilter) => void;
}) {
  return (
    <View style={styles.container}>
      <SearchField
        accessibilityLabel="Search billing invoices"
        value={search}
        onChangeText={onSearchChange}
        placeholder="Search invoice, customer, subscription or package"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <FilterGroup
        label="Invoice status"
        filters={invoiceFilters}
        selected={invoiceStatus}
        onChange={onInvoiceStatusChange}
      />
      <FilterGroup
        label="Payment status"
        filters={paymentFilters}
        selected={paymentStatus}
        onChange={onPaymentStatusChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md, marginBottom: spacing.lg },
  group: { gap: spacing.sm },
  groupLabel: { ...typography.small, color: colors.muted },
  filters: { gap: spacing.sm, paddingRight: spacing.lg },
  filter: {
    minHeight: 44,
    justifyContent: 'center',
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
  filterLabel: { ...typography.label, color: colors.muted },
  selectedLabel: { color: colors.primary },
});
