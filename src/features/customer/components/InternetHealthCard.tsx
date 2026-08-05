import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  AppIcon,
  AppText,
  GradientBackground,
  StatusBadge,
} from '@/components';
import type { NetworkStatus } from '@/services/network';
import {
  animation,
  colors,
  gradients,
  radius,
  shadows,
  spacing,
  typography,
} from '@/theme';
import { ConnectionQualityIndicator } from './ConnectionQualityIndicator';

interface InternetHealthCardProps {
  network: NetworkStatus;
}

function InternetHealthCardComponent({ network }: InternetHealthCardProps) {
  const online = network.connectionStatus === 'online';

  return (
    <Animated.View entering={FadeInDown.duration(animation.duration.normal)}>
      <GradientBackground
        colors={[...gradients.internetStatus]}
        style={styles.card}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.icon}>
              <AppIcon name="wifi" size={24} color={colors.white} />
            </View>
            <View>
              <AppText style={styles.eyebrow}>INTERNET HEALTH</AppText>
              <AppText style={styles.title}>
                {online ? 'Your internet is healthy' : 'Connection interrupted'}
              </AppText>
            </View>
          </View>
          <StatusBadge
            label={network.connectionStatus}
            tone={online ? 'success' : 'danger'}
          />
        </View>

        <ConnectionQualityIndicator score={network.qualityScore} />

        <View style={styles.metrics}>
          <View
            accessible
            accessibilityLabel={`Latency ${network.latency} milliseconds`}
          >
            <AppText style={styles.metricLabel}>LATENCY</AppText>
            <AppText style={styles.metricValue}>{network.latency} ms</AppText>
          </View>
          <View style={styles.divider} />
          <View
            accessible
            accessibilityLabel={`Uptime ${network.uptime} percent`}
          >
            <AppText style={styles.metricLabel}>UPTIME</AppText>
            <AppText style={styles.metricValue}>{network.uptime}%</AppText>
          </View>
          <View style={styles.divider} />
          <View
            accessible
            accessibilityLabel={`Connection is ${network.connectionStatus}`}
          >
            <AppText style={styles.metricLabel}>CONNECTION</AppText>
            <AppText style={styles.metricValue}>
              {online ? 'Stable' : 'Offline'}
            </AppText>
          </View>
        </View>
      </GradientBackground>
    </Animated.View>
  );
}

export const InternetHealthCard = memo(InternetHealthCardComponent);

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xxl,
    padding: spacing.xl,
    gap: spacing.xxl,
    overflow: 'hidden',
    ...shadows.glow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  titleRow: { flex: 1, flexDirection: 'row', gap: spacing.md },
  icon: {
    width: spacing.huge + spacing.md,
    height: spacing.huge + spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.borderOnAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    ...typography.small,
    color: colors.textHero,
    fontFamily: typography.label.fontFamily,
    letterSpacing: spacing.xxs / 2,
  },
  title: {
    ...typography.bodyLarge,
    color: colors.white,
    fontFamily: typography.sectionTitle.fontFamily,
    marginTop: spacing.xs,
  },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderOnAccent,
    paddingTop: spacing.lg,
  },
  divider: {
    width: 1,
    height: spacing.huge,
    backgroundColor: colors.borderOnAccent,
  },
  metricLabel: { ...typography.small, color: colors.textHero },
  metricValue: {
    ...typography.label,
    color: colors.white,
    marginTop: spacing.xs,
  },
});
