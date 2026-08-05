import { AppText as Text } from '@/components/foundation/AppText';
import {
  useCustomerNavigation,
  type CustomerStackParamList,
} from '@/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
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
import { packages } from '@/services/mockData';
export default function PackageDetail({
  route,
}: NativeStackScreenProps<CustomerStackParamList, 'PackageDetail'>) {
  const navigation = useCustomerNavigation();
  const { id } = route.params;
  const p = packages.find(x => x.id === id) ?? packages[0]!;
  return (
    <Screen>
      <Header title={p.name} subtitle="AIRMAX internet package" />
      <Card style={styles.hero}>
        {p.popular ? <Badge label="Most popular" /> : null}
        <View style={styles.speed}>
          <Text style={styles.number}>{p.speed}</Text>
          <Text style={styles.unit}>Mbps</Text>
        </View>
        <Text style={styles.price}>
          {money(p.price)} <Text style={ui.small}>/ month</Text>
        </Text>
      </Card>
      <Text style={ui.sectionTitle}>What’s included</Text>
      <Card>
        {p.features.map((f, i) => (
          <View key={f} style={styles.feature}>
            <IconTile icon="checkmark" color={colors.success} />
            <Text style={styles.featureText}>{f}</Text>
            {i < p.features.length - 1 ? null : null}
          </View>
        ))}
      </Card>
      <Text style={ui.sectionTitle}>Package information</Text>
      <Text style={ui.body}>
        Unlimited data with no hidden usage caps. Installation and router fees
        may apply to new connections. Package changes activate on the next
        billing cycle.
      </Text>
      <Button
        title={
          p.id === 'premium' ? 'Renew this package' : 'Choose this package'
        }
        icon="flash-outline"
        onPress={() => navigation.navigate('Payment')}
      />
    </Screen>
  );
}
const styles = StyleSheet.create({
  hero: { alignItems: 'center', backgroundColor: colors.surfaceStrong },
  speed: { flexDirection: 'row', alignItems: 'baseline', marginTop: 16 },
  number: { fontSize: 64, fontWeight: '900', color: colors.primary },
  unit: { fontSize: 17, fontWeight: '800', color: colors.muted, marginLeft: 8 },
  price: { color: colors.text, fontSize: 22, fontWeight: '800' },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginVertical: 7,
  },
  featureText: { color: colors.text, fontWeight: '600' },
});
