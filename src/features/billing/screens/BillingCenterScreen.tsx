import { StyleSheet, View } from 'react-native';
import {
  AppHeader,
  AppScreen,
  AppText,
  BillingSkeleton,
  ErrorState,
  Row,
  Surface,
} from '@/components';
import {
  BillingSummaryCard,
  CurrentBillCard,
  InvoiceCard,
} from '@/features/billing/components';
import { useCustomerNavigation } from '@/navigation';
import { useCurrentBill, useCustomerInvoices } from '@/services/billing';
import { useCustomerProfile } from '@/services/customer/customerQueries';
import { colors, spacing, typography } from '@/theme';

export default function BillingCenterScreen() {
  const navigation = useCustomerNavigation();
  const profileQuery = useCustomerProfile();
  const customerId = profileQuery.data?.id;
  const billQuery = useCurrentBill(customerId);
  const invoiceQuery = useCustomerInvoices(customerId);
  if (profileQuery.isPending || billQuery.isPending || invoiceQuery.isPending)
    return (
      <AppScreen>
        <AppHeader
          title="Billing center"
          subtitle="Loading your billing information"
        />
        <BillingSkeleton />
      </AppScreen>
    );
  if (profileQuery.isError || billQuery.isError || invoiceQuery.isError)
    return (
      <AppScreen>
        <AppHeader title="Billing center" />
        <ErrorState
          title="Billing unavailable"
          message="We couldn't load your billing center."
          retry={() => {
            void profileQuery.refetch();
            void billQuery.refetch();
            void invoiceQuery.refetch();
          }}
        />
      </AppScreen>
    );
  const current = billQuery.data;
  return (
    <AppScreen contentContainerStyle={styles.content}>
      <AppHeader
        title="Billing center"
        subtitle="Payments, invoices and subscription records"
      />
      <CurrentBillCard
        bill={current}
        onPay={() => navigation.navigate('PaymentMethods')}
        onInvoice={() =>
          navigation.navigate('InvoiceDetail', { id: current.invoice.id })
        }
      />
      <AppText style={styles.sectionTitle}>Billing services</AppText>
      <Surface style={styles.links}>
        <Row
          icon="card-outline"
          title="Payment center"
          subtitle="Choose a secure payment method"
          onPress={() => navigation.navigate('PaymentMethods')}
        />
        <View style={styles.divider} />
        <Row
          icon="time-outline"
          title="Payment history"
          subtitle="Review transactions and references"
          onPress={() => navigation.navigate('PaymentHistory')}
        />
        <View style={styles.divider} />
        <Row
          icon="documents-outline"
          title="Invoice center"
          subtitle="Current and past invoices"
          onPress={() => navigation.navigate('Invoices')}
        />
      </Surface>
      <AppText style={styles.sectionTitle}>Subscription</AppText>
      <BillingSummaryCard summary={current.summary} />
      <View style={styles.recentHeader}>
        <AppText style={styles.sectionTitle}>Recent invoice</AppText>
        <AppText
          onPress={() => navigation.navigate('Invoices')}
          style={styles.link}
        >
          View all
        </AppText>
      </View>
      {invoiceQuery.data[0] ? (
        <InvoiceCard
          invoice={invoiceQuery.data[0]}
          onPress={() =>
            navigation.navigate('InvoiceDetail', {
              id: invoiceQuery.data[0]!.id,
            })
          }
        />
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.huge, gap: spacing.lg },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.text,
    marginTop: spacing.sm,
  },
  links: { gap: spacing.md },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  link: { ...typography.label, color: colors.primary },
});
