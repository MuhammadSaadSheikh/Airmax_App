import { View } from 'react-native';
import { Divider, Row, Surface } from '@/components';
import type { AdminCustomerDetail } from '@/services/api/customers.models';

export function CustomerContactCard({
  customer,
}: {
  customer: AdminCustomerDetail;
}) {
  return (
    <Surface>
      <Row icon="call-outline" title="Phone" subtitle={customer.phone} />
      <Divider />
      <Row
        icon="mail-outline"
        title="Email"
        subtitle={customer.email ?? 'Not provided'}
      />
      <Divider />
      <Row
        icon="card-outline"
        title="CNIC / ID"
        subtitle={customer.cnic ?? 'Not provided'}
      />
      <Divider />
      <View>
        <Row
          icon="location-outline"
          title="Service address"
          subtitle={customer.address ?? 'Not provided'}
        />
      </View>
    </Surface>
  );
}
