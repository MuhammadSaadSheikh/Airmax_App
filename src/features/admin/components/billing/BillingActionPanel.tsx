import { StyleSheet } from 'react-native';
import { AppText, Button, Surface } from '@/components';
import type { InvoiceStatus } from '@/services/api/billing.models';
import { colors, spacing, typography } from '@/theme';

export function getBillingActionVisibility(
  status: InvoiceStatus,
  canManagePayments: boolean,
  canCancelInvoice: boolean,
) {
  return {
    recordPayment:
      canManagePayments && (status === 'pending' || status === 'overdue'),
    markPaid:
      canManagePayments && (status === 'pending' || status === 'overdue'),
    cancel: canCancelInvoice && status === 'pending',
    readOnly: status === 'paid' || status === 'cancelled',
  };
}

export function BillingActionPanel({
  status,
  loading,
  canManagePayments,
  canCancelInvoice,
  onRecordPayment,
  onMarkPaid,
  onCancel,
}: {
  status: InvoiceStatus;
  loading: boolean;
  canManagePayments: boolean;
  canCancelInvoice: boolean;
  onRecordPayment: () => void;
  onMarkPaid: () => void;
  onCancel: () => void;
}) {
  const visibility = getBillingActionVisibility(
    status,
    canManagePayments,
    canCancelInvoice,
  );
  return (
    <Surface loading={loading}>
      {visibility.recordPayment ? (
        <Button
          title="Record payment"
          icon="cash-outline"
          loading={loading}
          onPress={onRecordPayment}
        />
      ) : null}
      {visibility.markPaid ? (
        <Button
          title="Mark paid manually"
          icon="checkmark-circle-outline"
          variant="secondary"
          disabled={loading}
          onPress={onMarkPaid}
        />
      ) : null}
      {visibility.cancel ? (
        <Button
          title="Cancel invoice"
          icon="close-circle-outline"
          variant="danger"
          disabled={loading}
          onPress={onCancel}
        />
      ) : null}
      {visibility.readOnly ? (
        <AppText style={styles.help}>
          {status === 'paid'
            ? 'Paid invoices are read only.'
            : 'Cancelled invoices are read only.'}
        </AppText>
      ) : null}
      {status === 'generated' ? (
        <AppText style={styles.help}>
          This invoice is awaiting release for payment.
        </AppText>
      ) : null}
    </Surface>
  );
}

const styles = StyleSheet.create({
  help: {
    ...typography.body,
    color: colors.textSecondary,
    marginVertical: spacing.sm,
  },
});
