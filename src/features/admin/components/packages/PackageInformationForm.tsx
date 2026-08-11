import type { Control, FieldErrors } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { TextField } from '@/components';
import type { PackageInformationValues } from '@/features/admin/package.schema';
import { PackageFeatureEditor } from './PackageFeatureEditor';

export function PackageInformationForm({
  control,
  errors,
  disabled,
}: {
  control: Control<PackageInformationValues>;
  errors: FieldErrors<PackageInformationValues>;
  disabled?: boolean;
}) {
  return (
    <>
      <Controller
        control={control}
        name="name"
        render={({ field: { onBlur, onChange, value } }) => (
          <TextField
            label="Package name"
            icon="flash-outline"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            editable={!disabled}
            error={errors.name?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="speedMbps"
        render={({ field: { onBlur, onChange, value } }) => (
          <TextField
            label="Speed (Mbps)"
            icon="speedometer-outline"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            keyboardType="decimal-pad"
            editable={!disabled}
            error={errors.speedMbps?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="price"
        render={({ field: { onBlur, onChange, value } }) => (
          <TextField
            label="Price (Rs.)"
            icon="cash-outline"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            keyboardType="decimal-pad"
            editable={!disabled}
            error={errors.price?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="durationDays"
        render={({ field: { onBlur, onChange, value } }) => (
          <TextField
            label="Duration (days)"
            icon="calendar-outline"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            keyboardType="number-pad"
            editable={!disabled}
            error={errors.durationDays?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="description"
        render={({ field: { onBlur, onChange, value } }) => (
          <TextField
            label="Description (optional)"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            editable={!disabled}
            multiline
            error={errors.description?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="features"
        render={({ field: { onBlur, onChange, value } }) => (
          <PackageFeatureEditor
            value={value}
            disabled={disabled}
            onBlur={onBlur}
            onChange={onChange}
            error={errors.features?.message}
          />
        )}
      />
    </>
  );
}
