import { AppText as Text } from '@/components/foundation/AppText';
import { navigationActions, useCustomerNavigation } from '@/navigation';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Card, Header, Row, Screen, ui } from '@/components';
import { colors } from '@/theme';
import { useAuthStore } from '@/store/auth.store';
export default function Profile() {
  const navigation = useCustomerNavigation();
  const { user, signOut } = useAuthStore();
  if (!user) return null;
  return (
    <Screen>
      <Header title="Profile" subtitle="Your account and connection" />
      <View style={styles.avatar}>
        <Text style={styles.initials}>
          {user.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .slice(0, 2)}
        </Text>
      </View>
      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.connection}>{user.connectionId}</Text>
      <Card style={{ marginTop: 22 }}>
        <Row
          icon="person-outline"
          title="Personal details"
          subtitle={`${user.phone} · ${user.email}`}
          onPress={() => navigation.navigate('EditProfile')}
        />
        <View style={ui.divider} />
        <Row
          icon="location-outline"
          title="Service address"
          subtitle={user.address}
        />
        <View style={ui.divider} />
        <Row icon="wifi-outline" title="Router" subtitle={user.router} />
        <View style={ui.divider} />
        <Row
          icon="calendar-outline"
          title="Installed"
          subtitle={user.installationDate}
        />
      </Card>
      <Text style={ui.sectionTitle}>Settings</Text>
      <Card>
        <Row
          icon="notifications-outline"
          title="Notifications"
          onPress={() => navigation.navigate('Notifications')}
        />
        <View style={ui.divider} />
        <Row
          icon="shield-checkmark-outline"
          title="Privacy & security"
          onPress={() => {}}
        />
        <View style={ui.divider} />
        <Row
          icon="document-text-outline"
          title="Terms of service"
          onPress={() => {}}
        />
      </Card>
      <Button
        title="Sign out"
        variant="danger"
        icon="log-out-outline"
        onPress={() =>
          Alert.alert('Sign out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Sign out',
              style: 'destructive',
              onPress: () => {
                signOut();
                navigationActions.showAuth();
              },
            },
          ])
        }
      />
      <Text style={styles.version}>AIRMAX v1.0.0</Text>
    </Screen>
  );
}
const styles = StyleSheet.create({
  avatar: {
    alignSelf: 'center',
    width: 82,
    height: 82,
    borderRadius: 27,
    backgroundColor: colors.surfaceAvatarAlt,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { color: colors.primary, fontSize: 27, fontWeight: '900' },
  name: {
    textAlign: 'center',
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 12,
  },
  connection: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  version: {
    color: colors.disabled,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 18,
  },
});
