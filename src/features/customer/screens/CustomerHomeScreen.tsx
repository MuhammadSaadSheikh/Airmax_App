import { AppText as Text } from '@/components/foundation/AppText';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useCustomerNavigation } from '@/navigation';
import LinearGradient from 'react-native-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';
import { Badge, Card, Header, IconTile, Screen, ui } from '@/components';
import { colors, money } from '@/theme';
import { useAppStore } from '@/store/app.store';
import { useAuthStore } from '@/store/auth.store';
export default function CustomerHome() {
  const navigation = useCustomerNavigation();
  const user = useAuthStore(s => s.user)!;
  const unread = useAppStore(s => s.notifications.filter(n => !n.read).length);
  const actions = [
    ['card-outline', 'Pay bill', () => navigation.navigate('Payment')],
    [
      'chatbox-ellipses-outline',
      'Complaint',
      () => navigation.navigate('NewComplaint'),
    ],
    [
      'speedometer-outline',
      'My package',
      () => navigation.navigate('ActivePackage'),
    ],
    [
      'arrow-up-circle-outline',
      'Upgrade',
      () => navigation.navigate('CustomerTabs', { screen: 'Packages' }),
    ],
  ] as const;
  return (
    <Screen>
      <Header
        title={`Hello, ${user.name.split(' ')[0]}`}
        subtitle={`Connection ${user.connectionId}`}
        action={
          <Pressable
            onPress={() => navigation.navigate('Notifications')}
            style={styles.bell}
          >
            <Ionicons
              name="notifications-outline"
              color={colors.text}
              size={23}
            />
            {unread ? (
              <View style={styles.count}>
                <Text style={styles.countText}>{unread}</Text>
              </View>
            ) : null}
          </Pressable>
        }
      />
      <LinearGradient
        colors={[colors.primaryDark, colors.primaryMid]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.overline}>INTERNET STATUS</Text>
            <Text style={styles.heroTitle}>Premium 100 Mbps</Text>
          </View>
          <Badge label="Active" tone="success" />
        </View>
        <View style={styles.signal}>
          <Ionicons name="wifi" color={colors.white} size={48} />
          <View>
            <Text style={styles.speed}>100</Text>
            <Text style={styles.mbps}>Mbps unlimited</Text>
          </View>
        </View>
        <View style={styles.heroBottom}>
          <View>
            <Text style={styles.overline}>EXPIRES</Text>
            <Text style={styles.heroMeta}>15 August 2026</Text>
          </View>
          <View>
            <Text style={styles.overline}>MONTHLY FEE</Text>
            <Text style={styles.heroMeta}>{money(3500)}</Text>
          </View>
        </View>
      </LinearGradient>
      <Text style={ui.sectionTitle}>Quick actions</Text>
      <View style={styles.actions}>
        {actions.map(([icon, label, onPress]) => (
          <Pressable
            key={label}
            onPress={onPress}
            style={({ pressed }) => [
              styles.action,
              pressed && { opacity: 0.7 },
            ]}
          >
            <IconTile icon={icon} />
            <Text style={styles.actionText}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.sectionRow}>
        <Text style={ui.sectionTitle}>This month</Text>
        <Pressable
          onPress={() =>
            navigation.navigate('CustomerTabs', { screen: 'Billing' })
          }
        >
          <Text style={styles.link}>View bills</Text>
        </Pressable>
      </View>
      <Card>
        <View style={styles.billRow}>
          <IconTile icon="receipt-outline" color={colors.warning} />
          <View style={{ flex: 1 }}>
            <Text style={styles.billTitle}>August bill</Text>
            <Text style={ui.small}>Due 10 Aug 2026</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.billTitle}>{money(3500)}</Text>
            <Badge label="Unpaid" tone="warning" />
          </View>
        </View>
      </Card>
      <Text style={ui.sectionTitle}>Service update</Text>
      <Card>
        <View style={styles.billRow}>
          <IconTile icon="construct-outline" />
          <View style={{ flex: 1 }}>
            <Text style={styles.billTitle}>Complaint in progress</Text>
            <Text style={ui.small}>CMP-2048 · Ali Raza assigned</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </View>
      </Card>
    </Screen>
  );
}
const styles = StyleSheet.create({
  bell: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  count: {
    position: 'absolute',
    right: 7,
    top: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center',
  },
  countText: { color: colors.white, fontSize: 10, fontWeight: '800' },
  hero: { borderRadius: 24, padding: 20, overflow: 'hidden' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between' },
  overline: {
    color: colors.textHero,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  heroTitle: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 21,
    marginTop: 5,
  },
  signal: {
    flexDirection: 'row',
    gap: 15,
    alignItems: 'center',
    marginVertical: 26,
  },
  speed: {
    color: colors.white,
    fontSize: 40,
    fontWeight: '900',
    lineHeight: 42,
  },
  mbps: { color: colors.textHeroSecondary, fontSize: 12 },
  heroBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.borderOnAccent,
    paddingTop: 15,
  },
  heroMeta: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 5,
  },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  action: { alignItems: 'center', gap: 7, width: '23%' },
  actionText: {
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  link: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 14,
  },
  billRow: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  billTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 5,
  },
});
