import { AppText as Text } from '@/components/foundation/AppText';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useAdminNavigation } from '@/navigation';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Badge, Button, Card, Header, Screen, ui } from '@/components';
import { colors, money } from '@/theme';
import { packages } from '@/services/mockData';
export default function AdminPackages() {
  const navigation = useAdminNavigation();
  return (
    <Screen>
      <Header
        title="Packages"
        subtitle={`${packages.length} active plans`}
        action={
          <Pressable
            onPress={() => navigation.navigate('PackageForm')}
            style={styles.add}
          >
            <Ionicons name="add" color={colors.background} size={25} />
          </Pressable>
        }
      />
      {packages.map(p => (
        <Card key={p.id} style={styles.card}>
          <View style={styles.top}>
            <View>
              <Text style={styles.name}>{p.name}</Text>
              <Text style={ui.small}>
                {p.features.length} features · {p.duration}
              </Text>
            </View>
            <Badge label={p.status} tone="success" />
          </View>
          <View style={styles.details}>
            <View>
              <Text style={styles.value}>{p.speed} Mbps</Text>
              <Text style={ui.small}>SPEED</Text>
            </View>
            <View>
              <Text style={styles.value}>{money(p.price)}</Text>
              <Text style={ui.small}>MONTHLY</Text>
            </View>
          </View>
          <View style={styles.actions}>
            <Button
              title="Edit"
              variant="secondary"
              icon="create-outline"
              onPress={() => navigation.navigate('PackageForm', { id: p.id })}
            />
            <Button
              title="Delete"
              variant="ghost"
              icon="trash-outline"
              onPress={() =>
                Alert.alert(
                  'Delete package',
                  `Delete ${p.name}? Existing subscribers will not be affected.`,
                )
              }
            />
          </View>
        </Card>
      ))}
    </Screen>
  );
}
const styles = StyleSheet.create({
  add: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: { marginBottom: 12 },
  top: { flexDirection: 'row', justifyContent: 'space-between' },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 5,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: 13,
    padding: 13,
    marginTop: 14,
  },
  value: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
    marginBottom: 4,
  },
  actions: { flexDirection: 'row', gap: 8 },
});
