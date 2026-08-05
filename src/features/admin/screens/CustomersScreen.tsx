import { AppText as Text } from '@/components/foundation/AppText';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useQuery } from '@tanstack/react-query';
import { useAdminNavigation } from '@/navigation';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import {
  Badge,
  Card,
  ErrorState,
  Header,
  LoadingState,
  Screen,
  ui,
} from '@/components';
import { colors } from '@/theme';
import { customersService } from '@/services/api';
import { queryKeys } from '@/services/query';
export default function Customers() {
  const navigation = useAdminNavigation();
  const [search, setSearch] = useState('');
  const q = useQuery({
    queryKey: queryKeys.customers,
    queryFn: customersService.list,
  });
  const data = useMemo(
    () =>
      q.data?.filter(c =>
        `${c.name} ${c.phone} ${c.connectionId}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [q.data, search],
  );
  return (
    <Screen>
      <Header
        title="Customers"
        subtitle="2,847 customer accounts"
        action={
          <Pressable
            onPress={() => navigation.navigate('CustomerForm')}
            style={styles.add}
          >
            <Ionicons name="add" color={colors.background} size={25} />
          </Pressable>
        }
      />
      <View style={styles.search}>
        <Ionicons name="search" size={20} color={colors.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search name, phone or ID"
          placeholderTextColor={colors.placeholderStrong}
          style={styles.input}
        />
        <Ionicons name="options-outline" size={20} color={colors.primary} />
      </View>
      {q.isLoading ? (
        <LoadingState />
      ) : q.isError ? (
        <ErrorState retry={() => q.refetch()} />
      ) : (
        data?.map((c, i) => (
          <Pressable
            key={c.id}
            onPress={() => navigation.navigate('CustomerDetail', { id: c.id })}
          >
            <Card style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.initial}>{c.name[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.row}>
                  <Text style={styles.name}>{c.name}</Text>
                  <Badge
                    label={i === 2 ? 'pending' : 'active'}
                    tone={i === 2 ? 'warning' : 'success'}
                  />
                </View>
                <Text style={ui.small}>
                  {c.connectionId} · {c.phone}
                </Text>
                <Text style={[ui.small, { marginTop: 4 }]}>{c.address}</Text>
              </View>
              <Ionicons name="chevron-forward" color={colors.muted} size={18} />
            </Card>
          </Pressable>
        ))
      )}
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
  search: {
    height: 52,
    borderRadius: 15,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 15,
  },
  input: { flex: 1, color: colors.text },
  card: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: colors.surfaceAvatar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { color: colors.primary, fontSize: 18, fontWeight: '900' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: { color: colors.text, fontSize: 15, fontWeight: '800' },
});
