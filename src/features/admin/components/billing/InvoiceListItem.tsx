import { StyleSheet, View } from 'react-native';
import { AppIcon, AppText, Surface } from '@/components';
import type { AdminInvoice } from '@/services/api/billing.models';
import { colors, money, spacing, typography } from '@/theme';
import { AnimatedPressable } from '@/utils/animations';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';

function displayDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Unavailable'
    : new Intl.DateTimeFormat('en-PK', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date);
}

export function InvoiceListItem({
  invoice,
  onPress,
}: {
  invoice: AdminInvoice;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`Open invoice ${invoice.invoiceNumber} for ${invoice.customer.name}`}
      onPress={onPress}
    >
      <Surface style={styles.card}>
        <View style={styles.header}>
          <View style={styles.identity}>
            <AppText style={styles.number}>{invoice.invoiceNumber}</AppText>
            <AppText numberOfLines={1} style={styles.customer}>
              {invoice.customer.name}
            </AppText>
          </View>
          <InvoiceStatusBadge status={invoice.status} />
        </View>
        <View style={styles.details}>
          <View style={styles.detailCopy}>
            <AppText style={styles.package}>
              {invoice.subscription.packageName} ·{' '}
              {invoice.subscription.packageSpeedMbps} Mbps
            </AppText>
            <AppText style={styles.subscription}>
              {invoice.subscription.id}
            </AppText>
          </View>
          <AppText style={styles.amount}>{money(invoice.amount)}</AppText>
        </View>
        <View style={styles.dueRow}>
          <AppIcon name="calendar-outline" size={16} color={colors.muted} />
          <AppText style={styles.due}>
            Due {displayDate(invoice.dueDate)}
          </AppText>
        </View>
      </Surface>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  identity: { flex: 1 },
  number: { ...typography.label, color: colors.primary },
  customer: {
    ...typography.sectionTitle,
    color: colors.text,
    marginTop: spacing.xs,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  detailCopy: { flex: 1 },
  package: { ...typography.label, color: colors.textSecondary },
  subscription: {
    ...typography.small,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  amount: { ...typography.sectionTitle, color: colors.text },
  dueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  due: { ...typography.small, color: colors.muted },
});
