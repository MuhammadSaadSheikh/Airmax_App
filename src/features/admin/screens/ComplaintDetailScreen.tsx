import { AppText as Text } from '@/components/foundation/AppText';
import { useAdminNavigation, type AdminStackParamList } from '@/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Badge, Button, Card, Header, Input, Screen, ui } from '@/components';
import { colors } from '@/theme';
import { useAppStore } from '@/store/app.store';
export default function ComplaintDetail({
  route,
}: NativeStackScreenProps<AdminStackParamList, 'ComplaintDetail'>) {
  const navigation = useAdminNavigation();
  const { id } = route.params;
  const c =
    useAppStore(s => s.complaints.find(x => x.id === id)) ??
    useAppStore.getState().complaints[0]!;
  const resolve = useAppStore(s => s.resolveComplaint);
  return (
    <Screen>
      <Header title={c.id} subtitle="Complaint details" />
      <View style={styles.row}>
        <Badge
          label={c.status}
          tone={c.status === 'resolved' ? 'success' : 'info'}
        />
        <Text style={ui.small}>{c.createdAt}</Text>
      </View>
      <Text style={ui.sectionTitle}>{c.category}</Text>
      <Card>
        <Text style={ui.body}>{c.description}</Text>
      </Card>
      <Text style={ui.sectionTitle}>Customer</Text>
      <Card>
        <Text style={styles.name}>Ahmed Khan</Text>
        <Text style={ui.small}>AMX-1042 · +92 300 1234567</Text>
      </Card>
      <Text style={ui.sectionTitle}>Assignment</Text>
      <View style={styles.assign}>
        <Pressable style={styles.select}>
          <Text style={ui.small}>TECHNICIAN</Text>
          <Text style={styles.name}>{c.technician ?? 'Choose technician'}</Text>
        </Pressable>
        <Pressable style={styles.select}>
          <Text style={ui.small}>STATUS</Text>
          <Text style={styles.name}>{c.status.replace('_', ' ')}</Text>
        </Pressable>
      </View>
      <Input
        label="Reply to customer"
        placeholder="Write an update…"
        multiline
      />
      <Button
        title="Send update"
        variant="secondary"
        icon="send-outline"
        onPress={() => Alert.alert('Update sent')}
      />
      {c.status !== 'resolved' ? (
        <Button
          title="Mark as resolved"
          icon="checkmark-done-outline"
          onPress={() => {
            resolve(c.id);
            Alert.alert('Complaint resolved');
            navigation.goBack();
          }}
        />
      ) : null}
    </Screen>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
    marginBottom: 5,
    textTransform: 'capitalize',
  },
  assign: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  select: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    padding: 14,
    gap: 6,
  },
});
