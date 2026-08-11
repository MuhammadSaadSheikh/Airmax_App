import { TextField } from '@/components';

export function PackageFeatureEditor({
  value,
  error,
  disabled,
  onBlur,
  onChange,
}: {
  value: string;
  error?: string;
  disabled?: boolean;
  onBlur: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <TextField
      label="Features (one per line)"
      placeholder={'Unlimited browsing\nPriority support'}
      value={value}
      onBlur={onBlur}
      onChangeText={onChange}
      editable={!disabled}
      multiline
      numberOfLines={5}
      error={error}
    />
  );
}
