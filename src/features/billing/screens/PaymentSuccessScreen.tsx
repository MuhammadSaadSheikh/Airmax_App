import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import {
  AppIcon,
  AppScreen,
  AppText,
  PrimaryButton,
  SecondaryButton,
  Surface,
} from '@/components';
import type { CustomerStackParamList } from '@/navigation';
import { useCustomerNavigation } from '@/navigation';
import { animation, colors, money, radius, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<CustomerStackParamList, 'PaymentSuccess'>;
export default function PaymentSuccessScreen({ route }: Props) {
  const navigation = useCustomerNavigation();
  const { receipt } = route.params;
  const completed = receipt.status === 'completed';
  const pending = receipt.status === 'pending';
  const title = completed
    ? 'Payment successful'
    : pending
      ? 'Payment initiated'
      : 'Payment update';
  const subtitle = completed
    ? 'Your payment was confirmed securely.'
    : pending
      ? 'Your payment is awaiting provider confirmation.'
      : `Your payment is ${receipt.status}.`;
  return (
    <AppScreen contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Animated.View
          entering={ZoomIn.springify().damping(animation.spring.gentle.damping)}
          style={[styles.success, pending && styles.pending]}
        >
          <AppIcon
            name={
              completed
                ? 'checkmark'
                : pending
                  ? 'time-outline'
                  : 'information-outline'
            }
            color={colors.textOnAccent}
            size={spacing.huge}
          />
        </Animated.View>
        <Animated.View
          entering={FadeInDown.delay(animation.duration.fast)}
          style={styles.copy}
        >
          <AppText style={styles.title}>{title}</AppText>
          <AppText style={styles.subtitle}>{subtitle}</AppText>
        </Animated.View>
      </View>
      <Surface style={styles.receipt}>
        <Detail
          label={completed ? 'Amount paid' : 'Payment amount'}
          value={money(receipt.amount)}
        />
        <Detail label="Status" value={receipt.status} />
        <Detail label="Invoice" value={receipt.invoiceId} />
        <Detail label="Method" value={receipt.method} />
        <Detail label="Reference" value={receipt.reference} />
        <Detail label="Transaction" value={receipt.transactionId} />
      </Surface>
      <View style={styles.actions}>
        <PrimaryButton
          title="BACK TO BILLING"
          icon="receipt-outline"
          onPress={() =>
            navigation.navigate('CustomerTabs', { screen: 'Billing' })
          }
        />
        <SecondaryButton
          title="VIEW INVOICE"
          icon="document-text-outline"
          onPress={() =>
            navigation.navigate('InvoiceDetail', { id: receipt.invoiceId })
          }
        />
      </View>
    </AppScreen>
  );
}
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <AppText style={styles.label}>{label}</AppText>
      <AppText selectable style={styles.value}>
        {value}
      </AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.huge,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  hero: { alignItems: 'center', gap: spacing.lg },
  success: {
    width: spacing.huge * 2,
    height: spacing.huge * 2,
    borderRadius: radius.pill,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { alignItems: 'center', gap: spacing.xs },
  title: { ...typography.screenTitle, color: colors.text, textAlign: 'center' },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  receipt: { gap: spacing.md },
  detail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  label: { ...typography.body, color: colors.muted },
  value: {
    ...typography.label,
    color: colors.text,
    textAlign: 'right',
    flex: 1,
  },
  actions: { gap: spacing.sm },
  pending: { backgroundColor: colors.warning },
});
