import { useAdminNavigation, type AdminStackParamList } from '@/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert } from 'react-native';
import { Button, Header, Input, Screen } from '@/components';
import { packages } from '@/services/mockData';
export default function PackageForm({
  route,
}: NativeStackScreenProps<AdminStackParamList, 'PackageForm'>) {
  const navigation = useAdminNavigation();
  const id = route.params?.id;
  const p = packages.find(x => x.id === id);
  return (
    <Screen>
      <Header
        title={p ? 'Edit package' : 'Create package'}
        subtitle="Configure speed, pricing and features"
      />
      <Input label="Package name" icon="flash-outline" defaultValue={p?.name} />
      <Input
        label="Speed (Mbps)"
        icon="speedometer-outline"
        keyboardType="number-pad"
        defaultValue={p?.speed.toString()}
      />
      <Input
        label="Monthly price (Rs.)"
        icon="cash-outline"
        keyboardType="number-pad"
        defaultValue={p?.price.toString()}
      />
      <Input
        label="Description"
        multiline
        defaultValue={p ? 'High-speed unlimited internet.' : ''}
      />
      <Input
        label="Features (one per line)"
        multiline
        numberOfLines={5}
        defaultValue={p?.features.join('\n')}
      />
      <Input label="Status" value="Active" editable={false} />
      <Button
        title={p ? 'Save package' : 'Create package'}
        onPress={() =>
          Alert.alert(
            'Package saved',
            'Your package catalogue has been updated.',
            [{ text: 'Done', onPress: () => navigation.goBack() }],
          )
        }
      />
    </Screen>
  );
}
