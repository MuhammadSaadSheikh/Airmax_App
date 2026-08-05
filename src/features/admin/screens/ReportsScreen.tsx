import { AppText as Text } from '@/components/foundation/AppText';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Card, Header, IconTile, Screen, ui } from '@/components';
import { colors } from '@/theme';
const reports = [
  [
    'Financial report',
    'Revenue, invoices and outstanding balances',
    'cash-outline',
  ],
  ['Customer report', 'Growth, churn and connection status', 'people-outline'],
  [
    'Complaint report',
    'Categories, response and resolution time',
    'chatbox-outline',
  ],
  [
    'Package report',
    'Subscribers and revenue by package',
    'speedometer-outline',
  ],
];
export default function Reports() {
  return (
    <Screen>
      <Header title="Reports" subtitle="Operational and financial insights" />
      <Card style={styles.summary}>
        <Text style={ui.small}>AUGUST 2026 REVENUE</Text>
        <Text style={styles.value}>Rs. 8.42M</Text>
        <Text style={styles.growth}>↑ 12.8% versus July</Text>
      </Card>
      <Text style={ui.sectionTitle}>Generate report</Text>
      {reports.map(([title, desc, icon]) => (
        <Card key={title} style={styles.report}>
          <IconTile icon={icon as any} />
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{title}</Text>
            <Text style={ui.small}>{desc}</Text>
          </View>
          <Button
            title="Export"
            variant="ghost"
            icon="download-outline"
            onPress={() =>
              Alert.alert('Report generated', `${title} is ready to download.`)
            }
          />
        </Card>
      ))}
    </Screen>
  );
}
const styles = StyleSheet.create({
  summary: { backgroundColor: colors.surfaceStrong },
  value: {
    color: colors.text,
    fontSize: 35,
    fontWeight: '900',
    marginVertical: 8,
  },
  growth: { color: colors.success, fontSize: 12, fontWeight: '700' },
  report: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  title: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
    marginBottom: 5,
  },
});
