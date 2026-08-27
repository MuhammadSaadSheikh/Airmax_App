import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppHeader,
  AppIcon,
  AppScreen,
  AppText,
  ErrorState,
  PrimaryButton,
  SkeletonCard,
  Surface,
} from '@/components';
import { PaymentMethodCard } from '@/features/billing/components';
import { useCustomerNavigation } from '@/navigation';
import {
  useCurrentBill,
  useInitiatePayment,
  usePaymentMethods,
} from '@/services/billing';
import { useCustomerProfile } from '@/services/customer/customerQueries';
import { colors, money, spacing, typography } from '@/theme';

export default function PaymentMethodsScreen() {
  const navigation = useCustomerNavigation();
  const profileQuery = useCustomerProfile();
  const customerId = profileQuery.data?.id;
  const [selectedId, setSelectedId] = useState<string>();
  const billQuery = useCurrentBill(customerId);
  const methodsQuery = usePaymentMethods(customerId);
  const selected =
    selectedId ?? methodsQuery.data?.find(method => method.isDefault)?.id;
  const mutation = useInitiatePayment(
    customerId,
    profileQuery.data?.connectionId,
  );
  const pay = useCallback(() => {
    if (selected && billQuery.data) {
      mutation.mutate(
        { invoiceId: billQuery.data.invoice.id, methodId: selected },
        {
          onSuccess: receipt =>
            navigation.replace('PaymentSuccess', { receipt }),
        },
      );
    }
  }, [billQuery.data, mutation, navigation, selected]);
  if (profileQuery.isPending || billQuery.isPending || methodsQuery.isPending)
    return (
      <AppScreen>
        <AppHeader title="Payment center" showBack />
        <SkeletonCard lines={6} />
      </AppScreen>
    );
  if (profileQuery.isError || billQuery.isError || methodsQuery.isError)
    return (
      <AppScreen>
        <AppHeader title="Payment center" showBack />
        <ErrorState
          title="Payment methods unavailable"
          message="We couldn't prepare the secure payment flow."
          retry={() => {
            void profileQuery.refetch();
            void billQuery.refetch();
            void methodsQuery.refetch();
          }}
        />
      </AppScreen>
    );
  return (
    <AppScreen contentContainerStyle={styles.content}>
      <AppHeader
        title="Payment center"
        subtitle="Secure payment powered by AIRMAX"
        showBack
      />
      <Surface style={styles.amountCard}>
        <AppText style={styles.eyebrow}>AMOUNT DUE</AppText>
        <AppText style={styles.amount}>
          {money(billQuery.data.summary.currentAmount)}
        </AppText>
        <View style={styles.billLine}>
          <AppText style={styles.billText}>{billQuery.data.invoice.id}</AppText>
          <AppText style={styles.billText}>
            Due {billQuery.data.summary.dueDate}
          </AppText>
        </View>
      </Surface>
      <AppText style={styles.sectionTitle}>Select payment method</AppText>
      <View accessibilityRole="radiogroup" style={styles.methods}>
        {methodsQuery.data.map(method => (
          <PaymentMethodCard
            key={method.id}
            method={method}
            selected={selected === method.id}
            onPress={() => setSelectedId(method.id)}
          />
        ))}
      </View>
      <Surface style={styles.confirm}>
        <AppText style={styles.confirmTitle}>Payment confirmation</AppText>
        <AppText style={styles.confirmText}>
          You are authorizing a one-time payment of{' '}
          {money(billQuery.data.summary.currentAmount)}. Review the selected
          method before continuing.
        </AppText>
      </Surface>
      <View style={styles.security}>
        <AppIcon
          name="shield-checkmark-outline"
          color={colors.success}
          size={20}
        />
        <AppText style={styles.securityText}>
          Payment details are masked and never stored by AIRMAX. Biometric
          approval can be added when gateway integration is enabled.
        </AppText>
      </View>
      {mutation.isError ? (
        <AppText accessibilityLiveRegion="assertive" style={styles.error}>
          Payment could not be initiated. Please try again.
        </AppText>
      ) : null}
      <PrimaryButton
        title={`PAY ${money(billQuery.data.summary.currentAmount)}`}
        icon="lock-closed-outline"
        onPress={pay}
        loading={mutation.isPending}
        disabled={!selected}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.huge, gap: spacing.lg },
  amountCard: { gap: spacing.sm },
  eyebrow: { ...typography.small, color: colors.muted },
  amount: { ...typography.screenTitle, color: colors.text },
  billLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  billText: { ...typography.small, color: colors.textSecondary },
  sectionTitle: { ...typography.sectionTitle, color: colors.text },
  methods: { gap: spacing.md },
  confirm: { gap: spacing.sm },
  confirmTitle: { ...typography.label, color: colors.text },
  confirmText: { ...typography.body, color: colors.textSecondary },
  security: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  securityText: { ...typography.small, color: colors.muted, flex: 1 },
  error: { ...typography.body, color: colors.danger, textAlign: 'center' },
});
