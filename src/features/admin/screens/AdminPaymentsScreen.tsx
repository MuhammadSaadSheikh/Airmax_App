import { AppText as Text } from '@/components/foundation/AppText';
import { Alert, StyleSheet, View } from 'react-native';
import {
  Badge,
  Button,
  Card,
  Header,
  Screen,
  StatCard,
  ui,
} from '@/components';
import { colors, money } from '@/theme';
const items = [
  ['Ahmed Khan', 'AMX-2608-1042', 3500, 'unpaid'],
  ['Sara Ali', 'AMX-2608-1188', 2500, 'paid'],
  ['Hamza Noor', 'AMX-2608-1204', 1500, 'overdue'],
] as const;
export default function Payments() {
  return (
    <Screen>
      <Header title="Payments" subtitle="Invoices and collections" />
      <View style={styles.stats}>
        <StatCard
          icon="cash-outline"
          label="Collected"
          value="Rs. 8.4M"
          color={colors.success}
        />
        <StatCard
          icon="time-outline"
          label="Outstanding"
          value="Rs. 546K"
          color={colors.warning}
        />
      </View>
      <Button
        title="Generate monthly bills"
        icon="documents-outline"
        onPress={() =>
          Alert.alert(
            'Bills generated',
            '2,847 invoices were queued for delivery.',
          )
        }
      />
      <Text style={ui.sectionTitle}>Recent invoices</Text>
      {items.map(([name, invoice, amount, status]) => (
        <Card key={invoice} style={styles.item}>
          <View style={styles.row}>
            <View>
              <Text style={styles.name}>{name}</Text>
              <Text style={ui.small}>{invoice}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 5 }}>
              <Text style={styles.amount}>{money(amount)}</Text>
              <Badge
                label={status}
                tone={
                  status === 'paid'
                    ? 'success'
                    : status === 'overdue'
                      ? 'danger'
                      : 'warning'
                }
              />
            </View>
          </View>
        </Card>
      ))}
    </Screen>
  );
}
const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 12 },
  item: { marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  name: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
    marginBottom: 5,
  },
  amount: { color: colors.text, fontWeight: '800' },
});
