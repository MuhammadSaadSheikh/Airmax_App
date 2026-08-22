import { Button } from '@/components';

export function ReportExportAction({
  disabled,
  onPress,
}: {
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Button
      title="Export CSV"
      icon="download-outline"
      variant="ghost"
      disabled={disabled}
      onPress={onPress}
    />
  );
}
