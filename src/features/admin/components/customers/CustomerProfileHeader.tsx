import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components';
import type { AdminCustomerDetail } from '@/services/api/customers.models';
import { colors, fontSizes, radius, spacing, typography } from '@/theme';
import { CustomerStatusBadge } from './CustomerStatusBadge';

export function CustomerProfileHeader({
  customer,
}: {
  customer: AdminCustomerDetail;
}) {
  return (
    <View style={styles.profile}>
      <View style={styles.avatar}>
        <AppText style={styles.initial}>
          {customer.name.charAt(0).toUpperCase()}
        </AppText>
      </View>
      <View style={styles.content}>
        <AppText style={styles.name}>{customer.name}</AppText>
        <AppText style={styles.connection}>
          {customer.connectionId ?? 'Connection pending'}
        </AppText>
        <View style={styles.statusRow}>
          <CustomerStatusBadge status={customer.status} />
          <AppText style={styles.since}>
            Since {formatDate(customer.createdAt)}
          </AppText>
        </View>
      </View>
    </View>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Unknown'
    : new Intl.DateTimeFormat('en-PK', {
        month: 'short',
        year: 'numeric',
      }).format(date);
}

const styles = StyleSheet.create({
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radius.xxl,
    backgroundColor: colors.surfaceAvatar,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: colors.primary,
    fontFamily: typography.screenTitle.fontFamily,
    fontSize: fontSizes.display,
  },
  content: { flex: 1, gap: spacing.xs },
  name: { ...typography.sectionTitle, color: colors.text },
  connection: { ...typography.label, color: colors.textSecondary },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  since: { ...typography.small, color: colors.muted },
});
