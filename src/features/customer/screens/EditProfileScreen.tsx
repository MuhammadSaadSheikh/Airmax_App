import { useCustomerNavigation } from '@/navigation';
import { Alert } from 'react-native';
import { Button, Header, Input, Screen } from '@/components';
import { useAuthStore } from '@/store/auth.store';
import { useState } from 'react';
import { useCurrentUser } from '@/services/auth/useCurrentUser';
import { environment } from '@/config/environment';
import { queryClient, queryKeys } from '@/services/query';
import type { CurrentUser } from '@/services/api/auth.models';
export default function EditProfile() {
  const navigation = useCustomerNavigation();
  const sessionUser = useAuthStore(state => state.user);
  const profileQuery = useCurrentUser();
  const user = profileQuery.data ?? sessionUser;
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [address, setAddress] = useState(user?.address ?? '');
  return (
    <Screen>
      <Header
        title="Personal details"
        subtitle="Keep your contact information current"
      />
      <Input
        label="Full name"
        icon="person-outline"
        value={name}
        onChangeText={setName}
      />
      <Input
        label="Phone number"
        icon="call-outline"
        value={phone}
        onChangeText={setPhone}
      />
      <Input
        label="Email"
        icon="mail-outline"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <Input
        label="Address"
        icon="location-outline"
        value={address}
        onChangeText={setAddress}
        multiline
      />
      <Input
        label="New password (optional)"
        icon="lock-closed-outline"
        secureTextEntry
      />
      <Button
        title="Save changes"
        onPress={() => {
          if (!environment.useMockApi) {
            Alert.alert(
              'Profile updates unavailable',
              'The current backend does not expose a secure profile update endpoint.',
            );
            return;
          }
          queryClient.setQueryData<CurrentUser>(
            queryKeys.currentUser,
            current =>
              current ? { ...current, name, phone, email, address } : undefined,
          );
          Alert.alert('Profile updated');
          navigation.goBack();
        }}
      />
    </Screen>
  );
}
