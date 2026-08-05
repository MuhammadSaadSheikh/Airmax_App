import { useCustomerNavigation } from '@/navigation';
import { Alert } from 'react-native';
import { Button, Header, Input, Screen } from '@/components';
import { useAuthStore } from '@/store/auth.store';
import { useState } from 'react';
export default function EditProfile() {
  const navigation = useCustomerNavigation();
  const { user, updateProfile } = useAuthStore();
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
          updateProfile({ name, phone, email, address });
          Alert.alert('Profile updated');
          navigation.goBack();
        }}
      />
    </Screen>
  );
}
