import { AppText as Text } from '@/components/foundation/AppText';
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
import { useCustomerProfile } from '@/services/customer';
import { authenticatedPackageService } from '@/services/package';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/services/query';
export default function ActivePackage() {
  const navigation = useCustomerNavigation();
  const customerQuery = useCustomerProfile();
  const customerId = customerQuery.data?.id;
  const currentQuery = useQuery({
    queryKey: queryKeys.currentPackage(customerId ?? 'pending'),
    queryFn: () => authenticatedPackageService.getCurrentPackage(customerId!),
    enabled: Boolean(customerId),
  });
  if (customerQuery.isPending || currentQuery.isPending) {
    return (
      <Screen>
        <Header title="Active package" subtitle="Your current internet plan" />
        <LoadingState message="Loading your active package…" />
      </Screen>
    );
  }
  if (customerQuery.isError || currentQuery.isError || !currentQuery.data) {
    return (
      <Screen>
        <Header title="Active package" subtitle="Your current internet plan" />
        <ErrorState
          title="Active package unavailable"
          message="We couldn’t load your current subscription."
          retry={() => {
            void customerQuery.refetch();
            void currentQuery.refetch();
          }}
        />
      </Screen>
    );
  }
  const current = currentQuery.data;
  return (
    <Screen>
      <Header title="Active package" subtitle="Your current internet plan" />
      <Card style={styles.hero}>
        <Badge
          label={current.subscription.status}
          tone={
            current.subscription.status === 'active' ? 'success' : 'warning'
          }
        />
        <Text style={styles.name}>{current.package.name}</Text>
        <View style={styles.speedRow}>
          <Text style={styles.speed}>{current.package.speed}</Text>
          <Text style={styles.mbps}>Mbps</Text>
        </View>
        <Text style={ui.body}>{current.package.description}</Text>
      </Card>
      <Text style={ui.sectionTitle}>Plan details</Text>
      <Card>
        <Detail
          icon="flash-outline"
          label="Speed"
          value={`${current.package.speed} Mbps`}
        />
        <Detail
          icon="calendar-outline"
          label="Activated"
          value={formatDate(current.subscription.activationDate)}
        />
        <Detail
          icon="time-outline"
          label="Expires"
          value={formatDate(current.subscription.expiryDate)}
        />
        <Detail
          icon="cash-outline"
          label="Plan fee"
          value={money(current.package.price)}
        />
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
function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
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
