import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppIcon, AppText } from '@/components';
import { colors, spacing, typography } from '@/theme';

function PingIndicatorComponent({ ping, jitter }: { ping: number; jitter: number }) {
  const healthy = ping < 30;
  return (
    <View
      accessible
      accessibilityLabel={`Ping ${ping} milliseconds, jitter ${jitter} milliseconds`}
      style={styles.row}
    >
      <AppIcon name="pulse-outline" color={healthy ? colors.success : colors.warning} size={20} />
      <View style={styles.copy}>
        <AppText style={styles.value}>{ping} ms ping</AppText>
        <AppText style={styles.detail}>{jitter} ms jitter</AppText>
      </View>
    </View>
  );
}

export const PingIndicator = memo(PingIndicatorComponent);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  copy: { flex: 1 },
  value: { ...typography.label, color: colors.text },
  detail: { ...typography.small, color: colors.muted },
});
