import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, SelectField, Surface } from '@/components';
import type {
  AdminCustomerDetail,
  SuspensionReason,
} from '@/services/api/customers.models';
import { spacing } from '@/theme';
import { MockActionNotice } from './MockActionNotice';

const suspensionReasons: ReadonlyArray<{
  value: SuspensionReason;
  label: string;
}> = [
  { value: 'non-payment', label: 'Non-payment' },
  { value: 'policy-violation', label: 'Policy violation' },
  { value: 'customer-request', label: 'Customer request' },
  { value: 'technical-review', label: 'Technical review' },
];

export function CustomerActionPanel({
  customer,
  loading,
  onActivate,
  onSuspend,
  onEdit,
  onChangePackage,
}: {
  customer: AdminCustomerDetail;
  loading: boolean;
  onActivate: () => void;
  onSuspend: (reason: SuspensionReason) => void;
  onEdit: () => void;
  onChangePackage: () => void;
}) {
  const [reason, setReason] = useState<SuspensionReason>();
  const reasonLabel = suspensionReasons.find(
    item => item.value === reason,
  )?.label;
  const canActivate =
    (customer.status === 'pending' || customer.status === 'suspended') &&
    customer.latestSubscription !== null;

  const selectReason = () =>
    Alert.alert(
      'Suspension reason',
      'Choose a reason for this mock suspension.',
      [
        ...suspensionReasons.map(item => ({
          text: item.label,
          onPress: () => setReason(item.value),
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ],
    );

  return (
    <View style={styles.container}>
      <MockActionNotice />
      <Surface>
        <Button
          title="Edit customer information"
          icon="create-outline"
          variant="secondary"
          disabled={loading}
          onPress={onEdit}
        />
        <Button
          title={
            customer.latestSubscription ? 'Change package' : 'Select package'
          }
          icon="swap-horizontal-outline"
          variant="secondary"
          disabled={loading}
          onPress={onChangePackage}
        />

        {canActivate ? (
          <Button
            title="Activate customer"
            icon="play-circle-outline"
            loading={loading}
            onPress={onActivate}
          />
        ) : null}

        {customer.status === 'active' ? (
          <View style={styles.suspension}>
            <SelectField
              label="Suspension reason"
              value={reasonLabel}
              placeholder="Select a reason"
              icon="alert-circle-outline"
              disabled={loading}
              onPress={selectReason}
            />
            <Button
              title="Suspend customer"
              icon="pause-circle-outline"
              variant="danger"
              loading={loading}
              disabled={!reason}
              onPress={() => reason && onSuspend(reason)}
            />
          </View>
        ) : null}
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  suspension: { marginTop: spacing.lg },
});
