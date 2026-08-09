import type { Control, FieldErrors } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { TextField } from '@/components';
import type { CustomerInformationValues } from '@/features/admin/customer.schema';

export function CustomerInformationForm({
  control,
  errors,
}: {
  control: Control<CustomerInformationValues>;
  errors: FieldErrors<CustomerInformationValues>;
}) {
  return (
    <>
      <Controller
        control={control}
        name="name"
        render={({ field: { onBlur, onChange, value } }) => (
          <TextField
            label="Full name"
            icon="person-outline"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.name?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="phone"
        render={({ field: { onBlur, onChange, value } }) => (
          <TextField
            label="Phone"
            icon="call-outline"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            keyboardType="phone-pad"
            error={errors.phone?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field: { onBlur, onChange, value } }) => (
          <TextField
            label="Email"
            icon="mail-outline"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="address"
        render={({ field: { onBlur, onChange, value } }) => (
          <TextField
            label="Service address"
            icon="location-outline"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            multiline
            error={errors.address?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="cnic"
        render={({ field: { onBlur, onChange, value } }) => (
          <TextField
            label="CNIC / ID"
            icon="card-outline"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            autoCapitalize="none"
            error={errors.cnic?.message}
          />
        )}
      />
    </>
  );
}
