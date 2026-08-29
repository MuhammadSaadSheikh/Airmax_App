import { AppText as Text } from '@/components/foundation/AppText';
import { useMutation, useQuery } from '@tanstack/react-query';
import { navigationActions } from '@/navigation';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Button, Header, Input, Screen, ui } from '@/components';
import { colors } from '@/theme';
import { installationsService } from '@/services/api';
import { packageService } from '@/services/packages';
import { queryKeys } from '@/services/query';
export default function Install() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [pkg, setPkg] = useState('plus');
  const [date, setDate] = useState('15 August 2026');
  const packagesQuery = useQuery({
    queryKey: queryKeys.installationPackageCatalogue,
    queryFn: packageService.getPackages,
  });
  const m = useMutation({
    mutationFn: () =>
      installationsService.create({
        name,
        phone,
        address,
        packageId: pkg,
        date,
      }),
    onSuccess: r =>
      Alert.alert(
        'Request received',
        `Reference ${r.id}. We’ll call you within one business day.`,
        [{ text: 'Done', onPress: navigationActions.showAuth }],
      ),
  });
  return (
    <Screen>
      <Header title="New connection" subtitle="Request AIRMAX installation" />
      <Input
        label="Full name"
        value={name}
        onChangeText={setName}
        icon="person-outline"
      />
      <Input
        label="Phone number"
        value={phone}
        onChangeText={setPhone}
        icon="call-outline"
        keyboardType="phone-pad"
      />
      <Input
        label="Installation address"
        value={address}
        onChangeText={setAddress}
        icon="location-outline"
        multiline
      />
      <Text style={ui.label}>Selected package</Text>
      <View style={styles.packages}>
        {(packagesQuery.data ?? []).slice(0, 3).map(p => (
          <Pressable
            key={p.id}
            onPress={() => setPkg(p.id)}
            style={[styles.pkg, pkg === p.id && styles.selected]}
          >
            <Text
              style={[
                styles.pkgName,
                pkg === p.id && { color: colors.primary },
              ]}
            >
              {p.name}
            </Text>
            <Text style={ui.small}>{p.speed} Mbps</Text>
          </Pressable>
        ))}
      </View>
      <Input
        label="Preferred installation date"
        icon="calendar-outline"
        value={date}
        onChangeText={setDate}
      />
      {!installationsService.supportsSubmission ? (
        <Text style={styles.unavailable}>
          Online installation requests are temporarily unavailable. Please
          contact AIRMAX support until secure public submission is available.
        </Text>
      ) : null}
      <Button
        title="Submit installation request"
        loading={m.isPending}
        disabled={
          !installationsService.supportsSubmission ||
          !name ||
          !phone ||
          !address ||
          packagesQuery.isPending
        }
        onPress={() => m.mutate()}
      />
    </Screen>
  );
}
const styles = StyleSheet.create({
  packages: { flexDirection: 'row', gap: 8, marginTop: 9, marginBottom: 18 },
  pkg: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selected: { borderColor: colors.primary },
  pkgName: { color: colors.text, fontWeight: '800', marginBottom: 4 },
  unavailable: {
    color: colors.warning,
    marginBottom: 16,
  },
});
