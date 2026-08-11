import { AppText as Text } from '@/components/foundation/AppText';
import { useAdminNavigation } from '@/navigation';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Card, Header, Row, Screen, ui } from '@/components';
import { colors } from '@/theme';
import { useAuthStore } from '@/store/auth.store';
export default function More() {
  const navigation = useAdminNavigation();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  return (
    <Screen>
      <Header title="Administration" subtitle="Operations and configuration" />
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.initial}>DA</Text>
        </View>
        <View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={ui.small}>Super administrator</Text>
        </View>
      </View>
      <Card>
        <Row
          icon="receipt-outline"
          title="Payment management"
          subtitle="Bills, invoices and collections"
          onPress={() => navigation.navigate('AdminPayments')}
        />
        <View style={ui.divider} />
        <Row
          icon="construct-outline"
          title="Technicians"
          subtitle="Assignments and availability"
          onPress={() => navigation.navigate('Technicians')}
        />
        <View style={ui.divider} />
        <Row
          icon="location-outline"
          title="Service areas"
          subtitle="Coverage and availability"
          onPress={() => navigation.navigate('ServiceAreas')}
        />
        <View style={ui.divider} />
        <Row
          icon="analytics-outline"
          title="Reports"
          subtitle="Financial and operational exports"
          onPress={() => navigation.navigate('Reports')}
        />
      </Card>
      <Text style={ui.sectionTitle}>System</Text>
      <Card>
        <Row
          icon="git-network-outline"
          title="Network integrations"
          subtitle="MikroTik and OLT adapters"
          onPress={() => {}}
        />
        <View style={ui.divider} />
        <Row
          icon="notifications-outline"
          title="Notification settings"
          onPress={() => {}}
        />
        <View style={ui.divider} />
        <Row
          icon="shield-checkmark-outline"
          title="Roles & permissions"
          onPress={() => {}}
        />
      </Card>
      <Button
        title="Sign out"
        variant="danger"
        icon="log-out-outline"
        onPress={() =>
          Alert.alert('Sign out', 'End this admin session?', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Sign out',
              onPress: () => void logout(),
            },
          ])
        }
      />
    </Screen>
  );
}
const styles = StyleSheet.create({
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.surfaceAvatar,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  initial: { color: colors.primary, fontWeight: '900', fontSize: 18 },
  name: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 17,
    marginBottom: 5,
  },
});
