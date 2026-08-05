import { AppText as Text } from '@/components/foundation/AppText';
import { useQuery } from '@tanstack/react-query';
import { useCustomerNavigation } from '@/navigation';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  ErrorState,
  Header,
  LoadingState,
  Screen,
  ui,
} from '@/components';
import { colors, money } from '@/theme';
import { packagesService } from '@/services/api';
import { queryKeys } from '@/services/query';
export default function Packages() {
  const navigation = useCustomerNavigation();
  const q = useQuery({
    queryKey: queryKeys.packages,
    queryFn: packagesService.list,
  });
  return (
    <Screen>
      <Header
        title="Internet packages"
        subtitle="Choose the speed that fits your life"
      />
      {q.isLoading ? (
        <LoadingState />
      ) : q.isError ? (
        <ErrorState retry={() => q.refetch()} />
      ) : (
        q.data?.map(p => (
          <Pressable
            key={p.id}
            onPress={() => navigation.navigate('PackageDetail', { id: p.id })}
          >
            <Card style={[styles.card, p.popular && styles.popular]}>
              {p.popular ? (
                <View style={styles.ribbon}>
                  <Text style={styles.ribbonText}>MOST POPULAR</Text>
                </View>
              ) : null}
              <View style={styles.top}>
                <View>
                  <Text style={styles.name}>{p.name}</Text>
                  <Text style={styles.duration}>{p.duration}</Text>
                </View>
                <View style={styles.speed}>
                  <Text style={styles.speedValue}>{p.speed}</Text>
                  <Text style={styles.speedUnit}>Mbps</Text>
                </View>
              </View>
              <View style={ui.divider} />
              {p.features.slice(0, 3).map(f => (
                <Text key={f} style={styles.feature}>
                  ✓ {f}
                </Text>
              ))}
              <View style={styles.price}>
                <Text style={styles.priceValue}>{money(p.price)}</Text>
                <Text style={ui.small}> / month</Text>
              </View>
              <Button
                title="View package"
                variant={p.popular ? 'primary' : 'secondary'}
                onPress={() =>
                  navigation.navigate('PackageDetail', { id: p.id })
                }
              />
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  card: { marginBottom: 15, overflow: 'hidden' },
  popular: { borderColor: colors.primary },
  ribbon: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 12,
  },
  ribbonText: { fontSize: 9, fontWeight: '900', color: colors.background },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: { fontSize: 20, fontWeight: '800', color: colors.text },
  duration: { fontSize: 12, color: colors.muted, marginTop: 4 },
  speed: { alignItems: 'flex-end', marginTop: 10 },
  speedValue: { fontSize: 30, fontWeight: '900', color: colors.primary },
  speedUnit: { fontSize: 11, color: colors.muted },
  feature: { color: colors.textSecondary, fontSize: 13, marginVertical: 4 },
  price: { flexDirection: 'row', alignItems: 'baseline', marginTop: 14 },
  priceValue: { color: colors.text, fontWeight: '800', fontSize: 20 },
});
