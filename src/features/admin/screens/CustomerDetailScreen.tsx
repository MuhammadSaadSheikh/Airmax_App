import { AppText as Text } from '@/components/foundation/AppText';
import type { AdminStackParamList } from '@/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, StyleSheet, View } from 'react-native';
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
import { customers } from '@/services/mockData';
export default function CustomerDetail({
  route,
}: NativeStackScreenProps<AdminStackParamList, 'CustomerDetail'>) {
  const { id } = route.params;
  const c = customers.find(x => x.id === id) ?? customers[0]!;
  return (
    <Screen>
      <Header title={c.name} subtitle={c.connectionId} />
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.initial}>{c.name[0]}</Text>
        </View>
        <View>
          <Badge label="Active" tone="success" />
          <Text style={[ui.small, { marginTop: 8 }]}>
            Customer since Jan 2025
          </Text>
        </View>
      </View>
      <Card>
        <Info icon="call-outline" label="Phone" value={c.phone} />
        <Info icon="mail-outline" label="Email" value={c.email} />
        <Info icon="location-outline" label="Address" value={c.address} />
      </Card>
      <Text style={ui.sectionTitle}>Connection</Text>
      <Card>
        <Info
          icon="speedometer-outline"
          label="Package"
          value="Premium · 100 Mbps"
        />
        <Info icon="cash-outline" label="Monthly fee" value={money(3500)} />
        <Info icon="calendar-outline" label="Expiry" value="15 Aug 2026" />
        <Info icon="checkmark-circle-outline" label="Payment" value="Paid" />
      </Card>
      <Button
        title="Edit customer"
        icon="create-outline"
        variant="secondary"
        onPress={() => {}}
      />
      <Button
        title="Change package"
        icon="swap-horizontal-outline"
        variant="secondary"
        onPress={() => {}}
      />
      <Button
        title="Suspend connection"
        icon="pause-circle-outline"
        variant="danger"
        onPress={() =>
          Alert.alert(
            'Suspend connection',
            `Suspend ${c.name}'s internet service?`,
          )
        }
      />
    </Screen>
  );
}
function Info({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.info}>
      <IconTile icon={icon} />
      <View>
        <Text style={ui.small}>{label.toUpperCase()}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 20,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 23,
    backgroundColor: colors.surfaceAvatar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { color: colors.primary, fontSize: 27, fontWeight: '900' },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginVertical: 8,
  },
  value: { color: colors.text, fontWeight: '700', fontSize: 14, marginTop: 4 },
});
