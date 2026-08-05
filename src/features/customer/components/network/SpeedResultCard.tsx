import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText, Surface } from '@/components';
import { SpeedMetricCard } from '@/features/customer/components/SpeedMetricCard';
import type { SpeedMetrics } from '@/services/network';
import { animation, colors, spacing, typography } from '@/theme';
import { PingIndicator } from './PingIndicator';

function SpeedResultCardComponent({ result }: { result: SpeedMetrics }) {
  return (
    <Animated.View entering={FadeInDown.duration(animation.duration.normal)}>
      <Surface style={styles.surface}>
        <AppText style={styles.title}>Latest result</AppText>
        <View style={styles.grid}>
          <SpeedMetricCard label="Download" value={result.downloadSpeed} unit="Mbps" icon="arrow-down-outline" />
          <SpeedMetricCard label="Upload" value={result.uploadSpeed} unit="Mbps" icon="arrow-up-outline" />
        </View>
        <PingIndicator ping={result.ping} jitter={result.jitter} />
        <AppText style={styles.timestamp}>
          Saved {new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </AppText>
      </Surface>
    </Animated.View>
  );
}

export const SpeedResultCard = memo(SpeedResultCardComponent);

const styles = StyleSheet.create({
  surface: { gap: spacing.lg },
  title: { ...typography.sectionTitle, color: colors.text },
  grid: { flexDirection: 'row', justifyContent: 'space-between' },
  timestamp: { ...typography.small, color: colors.muted },
});
