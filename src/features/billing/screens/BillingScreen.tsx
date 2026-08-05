import { AppText as Text } from '@/components/foundation/AppText';
import { useQuery } from '@tanstack/react-query';
import { useCustomerNavigation } from '@/navigation';
import { StyleSheet, View } from 'react-native';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Header,
  IconTile,
  LoadingState,
  Screen,
  ui,
} from '@/components';
import { colors, money } from '@/theme';
import { billingService } from '@/services/api';
import { queryKeys } from '@/services/query';
export default function Billing() {
  const navigation = useCustomerNavigation();
  const q = useQuery({
    queryKey: queryKeys.bills,
    queryFn: billingService.listInvoices,
  });
  return (
    <Screen>
      <Header title="Billing" subtitle="Invoices and payment history" />
      <Card style={styles.balance}>
        <Text style={ui.small}>OUTSTANDING BALANCE</Text>
        <Text style={styles.amount}>{money(3500)}</Text>
        <Text style={ui.small}>Invoice AMX-2608-1042 · Due 10 Aug</Text>
        <Button
          title="Pay now"
          icon="card-outline"
          onPress={() => navigation.navigate('Payment')}
        />
      </Card>
      <Text style={ui.sectionTitle}>All invoices</Text>
      {q.isLoading ? (
        <LoadingState />
      ) : q.isError ? (
        <ErrorState retry={() => q.refetch()} />
      ) : (
        q.data?.map(b => (
          <Card key={b.id} style={styles.bill}>
            <View style={styles.row}>
              <IconTile
                icon="document-text-outline"
                color={b.status === 'paid' ? colors.success : colors.warning}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.month}>{b.month}</Text>
                <Text style={ui.small}>
                  {b.invoice} · {b.date}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Text style={styles.value}>{money(b.amount)}</Text>
                <Badge
                  label={b.status}
                  tone={b.status === 'paid' ? 'success' : 'warning'}
                />
              </View>
            </View>
            <Button
              title="Download invoice"
              variant="ghost"
              icon="download-outline"
              onPress={() => {}}
            />
          </Card>
        ))
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  balance: { backgroundColor: colors.surfaceBalance },
  amount: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.text,
    marginVertical: 8,
  },
  bill: { marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  month: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 5,
  },
  value: { color: colors.text, fontWeight: '800' },
});
