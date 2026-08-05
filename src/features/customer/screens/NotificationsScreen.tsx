import { AppText as Text } from '@/components/foundation/AppText';
import { Pressable, StyleSheet, View } from 'react-native';
import { Card, Header, IconTile, Screen, ui } from '@/components';
import { colors } from '@/theme';
import { useAppStore } from '@/store/app.store';
export default function Notifications() {
  const { notifications, markAllRead } = useAppStore();
  return (
    <Screen>
      <Header
        title="Notifications"
        subtitle={`${notifications.filter(n => !n.read).length} unread`}
        action={
          <Pressable onPress={markAllRead}>
            <Text style={styles.link}>Mark all read</Text>
          </Pressable>
        }
      />
      {notifications.map(n => (
        <Card key={n.id} style={[styles.item, !n.read && styles.unread]}>
          <IconTile icon={n.icon as any} />
          <View style={{ flex: 1 }}>
            <View style={styles.row}>
              <Text style={styles.title}>{n.title}</Text>
              {!n.read ? <View style={styles.dot} /> : null}
            </View>
            <Text style={ui.body}>{n.message}</Text>
            <Text style={[ui.small, { marginTop: 7 }]}>{n.time}</Text>
          </View>
        </Card>
      ))}
    </Screen>
  );
}
const styles = StyleSheet.create({
  link: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  item: { marginBottom: 10, flexDirection: 'row', gap: 12 },
  unread: {
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceElevated,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  title: { color: colors.text, fontWeight: '800', marginBottom: 5 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});
