import { useCustomerNavigation } from '@/navigation';
import { Alert, StyleSheet } from 'react-native';
import {
  AppText,
  Button,
  ErrorState,
  Header,
  Input,
  LoadingState,
  Screen,
} from '@/components';
import { useState } from 'react';
import {
  useCustomerProfile,
  useUpdateCustomerProfile,
} from '@/services/customer';
import type { CustomerProfile } from '@/services/api/customer/customer.models';
import { colors, spacing, typography } from '@/theme';
export default function EditProfile() {
  const customerQuery = useCustomerProfile();

  if (customerQuery.isPending) {
    return (
      <Screen>
        <Header title="Personal details" />
        <LoadingState message="Loading your customer profile…" />
      </Screen>
    );
  }
  if (customerQuery.isError) {
    return (
      <Screen>
        <Header title="Personal details" />
        <ErrorState
          title="Profile unavailable"
          message="We couldn’t load your customer profile."
          retry={() => void customerQuery.refetch()}
        />
      </Screen>
    );
  }
  return <EditProfileForm customer={customerQuery.data} />;
}

function EditProfileForm({ customer }: { customer: CustomerProfile }) {
  const navigation = useCustomerNavigation();
  const updateMutation = useUpdateCustomerProfile();
  const [name, setName] = useState(customer.name);
  const [address, setAddress] = useState(customer.address ?? '');

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
        value={customer.phone}
        editable={false}
      />
      <Input
        label="Email"
        icon="mail-outline"
        value={customer.email ?? ''}
        editable={false}
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
        label="Password"
        icon="lock-closed-outline"
        value=""
        placeholder="Managed through account security"
        editable={false}
        secureTextEntry
      />
      {updateMutation.isError ? (
        <AppText accessibilityRole="alert" style={styles.error}>
          {updateMutation.error instanceof Error
            ? updateMutation.error.message
            : 'Your customer profile could not be updated.'}
        </AppText>
      ) : null}
      <Button
        title="Save changes"
        loading={updateMutation.isPending}
        disabled={!name.trim()}
        onPress={() => {
          updateMutation.mutate(
            {
              customerId: customer.id,
              input: {
                name: name.trim(),
                address: address.trim() || null,
              },
            },
            {
              onSuccess: () => {
                Alert.alert('Profile updated');
                navigation.goBack();
              },
            },
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: {
    ...typography.small,
    color: colors.danger,
    marginBottom: spacing.sm,
  },
});
