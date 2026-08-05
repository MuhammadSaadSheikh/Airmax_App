import { AppText as Text } from '@/components/foundation/AppText';
import { useCustomerNavigation } from '@/navigation';
import { StyleSheet, View } from 'react-native';
import {
  Badge,
  Button,
  Card,
  Header,
  IconTile,
  Screen,
  ui,
} from '@/components';
import { colors, money } from '@/theme';
export default function ActivePackage() {
  const navigation = useCustomerNavigation();
  return (
    <Screen>
      <Header title="Active package" subtitle="Your current internet plan" />
      <Card style={styles.hero}>
        <Badge label="Active" tone="success" />
        <Text style={styles.name}>Premium</Text>
        <View style={styles.speedRow}>
          <Text style={styles.speed}>100</Text>
          <Text style={styles.mbps}>Mbps</Text>
        </View>
        <Text style={ui.body}>
          Unlimited high-speed internet designed for 4K streaming, gaming, and
          connected homes.
        </Text>
      </Card>
      <Text style={ui.sectionTitle}>Plan details</Text>
      <Card>
        <Detail icon="flash-outline" label="Speed" value="100 Mbps" />
        <Detail
          icon="calendar-outline"
          label="Activated"
          value="15 July 2026"
        />
        <Detail icon="time-outline" label="Expires" value="15 August 2026" />
        <Detail icon="cash-outline" label="Monthly fee" value={money(3500)} />
        <Detail
          icon="checkmark-circle-outline"
          label="Payment"
          value="Paid"
          last
        />
      </Card>
      <Button
        title="Upgrade package"
        icon="arrow-up-circle-outline"
        onPress={() =>
          navigation.navigate('CustomerTabs', { screen: 'Packages' })
        }
      />
      <Button
        title="Renew package"
        variant="secondary"
        icon="refresh-outline"
        onPress={() => navigation.navigate('Payment')}
      />
    </Screen>
  );
}
function Detail({
  icon,
  label,
  value,
  last,
}: {
  icon: any;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <>
      <View style={styles.detail}>
        <IconTile icon={icon} />
        <Text style={ui.body}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
      {!last ? <View style={ui.divider} /> : null}
    </>
  );
}
const styles = StyleSheet.create({
  hero: { backgroundColor: colors.surfaceStrongAlt },
  name: { color: colors.text, fontSize: 29, fontWeight: '900', marginTop: 20 },
  speedRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 12,
  },
  speed: { color: colors.primary, fontSize: 48, fontWeight: '900' },
  mbps: { color: colors.muted, fontWeight: '700', marginLeft: 7 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  value: { marginLeft: 'auto', color: colors.text, fontWeight: '700' },
});
