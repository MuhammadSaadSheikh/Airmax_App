import { StyleSheet } from 'react-native';
import { AppText, Button, Surface } from '@/components';
import type { AdminPackage } from '@/services/api/packages.models';
import { colors, spacing, typography } from '@/theme';

export function PackageActionPanel({
  packageItem,
  loading,
  onEdit,
  onActivate,
  onDeactivate,
}: {
  packageItem: AdminPackage;
  loading: boolean;
  onEdit: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  return (
    <Surface>
      <AppText style={styles.help}>
        Existing subscription terms and invoices remain unchanged by catalogue
        updates.
      </AppText>
      <Button
        title="Edit package information"
        icon="create-outline"
        variant="secondary"
        disabled={loading}
        onPress={onEdit}
      />
      {packageItem.status === 'active' ? (
        <Button
          title="Deactivate package"
          icon="pause-circle-outline"
          variant="danger"
          loading={loading}
          onPress={onDeactivate}
        />
      ) : (
        <Button
          title="Activate package"
          icon="play-circle-outline"
          loading={loading}
          onPress={onActivate}
        />
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  help: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
});
