import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  AppHeader,
  AppIcon,
  AppScreen,
  AppText,
  ErrorState,
  SkeletonCard,
  Surface,
} from '@/components';
import {
  ConnectionTimeline,
  EquipmentStatusCard,
  HealthScoreIndicator,
  InternetHealthCard,
  NetworkQualityBadge,
  SpeedMetricCard,
} from '@/features/customer/components';
import { useCustomerNavigation } from '@/navigation';
import { networkHealthService } from '@/services/network';
import { queryKeys } from '@/services/query/queryKeys';
import { useAuthStore } from '@/store/auth.store';
import { animation, colors, radius, spacing, typography } from '@/theme';

export default function InternetHealthScreen() {
  const navigation = useCustomerNavigation();
  const connectionId = useAuthStore(
    state => state.user?.connectionId ?? 'unknown',
  );
  const query = useQuery({
    queryKey: queryKeys.networkHealth(connectionId),
    queryFn: () => networkHealthService.getHealth(connectionId),
    staleTime: 30_000,
  });
  const goToSpeedTest = useCallback(
    () => navigation.navigate('SpeedTest'),
    [navigation],
  );
  const goToDiagnostics = useCallback(
    () => navigation.navigate('Diagnostics'),
    [navigation],
  );

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <AppHeader
        title="Internet health"
        subtitle={`Connection ${connectionId}`}
        showBack
      />
      {query.isPending ? (
        <View style={styles.stack} accessibilityLabel="Loading internet health">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={2} />
        </View>
      ) : query.isError ? (
        <ErrorState
          title="Health check unavailable"
          message="We couldn't load your connection health."
          retry={() => void query.refetch()}
        />
      ) : (
        <Animated.View
          entering={FadeInDown.duration(animation.duration.normal)}
          style={styles.stack}
        >
          <InternetHealthCard
            network={{
              connectionStatus:
                query.data.health.status === 'connected' ? 'online' : 'offline',
              qualityScore: query.data.health.healthScore,
              latency: query.data.health.latency,
              uptime: query.data.health.uptime,
              routerStatus: query.data.equipment.routerStatus,
              fiberStatus: query.data.equipment.fiberStatus,
              wifiHealthy: query.data.equipment.wifiStatus === 'healthy',
            }}
          />

          <Surface style={styles.overview}>
            <View style={styles.overviewHeader}>
              <View>
                <AppText style={styles.eyebrow}>CONNECTION QUALITY</AppText>
                <NetworkQualityBadge quality={query.data.health.quality} />
              </View>
              <StatusPill areaIssue={query.data.health.areaIssue} />
            </View>
            <HealthScoreIndicator score={query.data.health.healthScore} />
          </Surface>

          <SectionTitle
            title="Current speed"
            subtitle="Latest connection snapshot"
          />
          <View style={styles.metrics}>
            <SpeedMetricCard
              label="Download"
              value={query.data.speed.downloadSpeed}
              unit="Mbps"
              icon="arrow-down-outline"
            />
            <SpeedMetricCard
              label="Upload"
              value={query.data.speed.uploadSpeed}
              unit="Mbps"
              icon="arrow-up-outline"
              delay={animation.duration.instant}
            />
            <SpeedMetricCard
              label="Ping"
              value={query.data.speed.ping}
              unit="ms"
              icon="pulse-outline"
              delay={animation.duration.fast}
            />
            <SpeedMetricCard
              label="Jitter"
              value={query.data.speed.jitter}
              unit="ms"
              icon="analytics-outline"
              delay={animation.duration.normal}
            />
          </View>
          <ActionCard
            title="Run a speed test"
            detail="Measure download, upload, ping and jitter"
            icon="speedometer-outline"
            onPress={goToSpeedTest}
          />

          <SectionTitle
            title="Equipment"
            subtitle="Your connected network hardware"
          />
          <EquipmentStatusCard equipment={query.data.equipment} />

          <SectionTitle
            title="Connection timeline"
            subtitle="Recent monitoring details"
          />
          <ConnectionTimeline
            connectedSince={query.data.health.connectedSince}
            lastChecked={query.data.health.lastChecked}
          />

          <ActionCard
            title="Diagnostics center"
            detail="Check internet, router, signal and latency"
            icon="shield-checkmark-outline"
            onPress={goToDiagnostics}
          />
        </Animated.View>
      )}
    </AppScreen>
  );
}

function StatusPill({ areaIssue }: { areaIssue: boolean }) {
  return (
    <View
      accessible
      accessibilityLabel={areaIssue ? 'Area issue detected' : 'No area issues'}
      style={styles.areaStatus}
    >
      <View
        style={[
          styles.statusDot,
          { backgroundColor: areaIssue ? colors.warning : colors.success },
        ]}
      />
      <AppText style={styles.areaText}>
        {areaIssue ? 'Area issue' : 'Area clear'}
      </AppText>
    </View>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.section}>
      <AppText style={styles.sectionTitle}>{title}</AppText>
      <AppText style={styles.sectionSubtitle}>{subtitle}</AppText>
    </View>
  );
}

function ActionCard({
  title,
  detail,
  icon,
  onPress,
}: {
  title: string;
  detail: string;
  icon: 'speedometer-outline' | 'shield-checkmark-outline';
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.action} onPress={onPress}>
      <View style={styles.actionIcon}>
        <AppIcon name={icon} color={colors.primary} size={23} />
      </View>
      <View style={styles.actionCopy}>
        <AppText style={styles.actionTitle}>{title}</AppText>
        <AppText style={styles.actionDetail}>{detail}</AppText>
      </View>
      <AppIcon name="chevron-forward" color={colors.muted} size={20} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.huge },
  stack: { gap: spacing.lg },
  overview: { gap: spacing.lg },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  eyebrow: {
    ...typography.small,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  areaStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
  },
  statusDot: {
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: radius.pill,
  },
  areaText: { ...typography.small, color: colors.textSecondary },
  section: { marginTop: spacing.sm, gap: spacing.xs },
  sectionTitle: { ...typography.sectionTitle, color: colors.text },
  sectionSubtitle: { ...typography.small, color: colors.muted },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  actionIcon: {
    width: spacing.huge + spacing.md,
    height: spacing.huge + spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAccent,
  },
  actionCopy: { flex: 1 },
  actionTitle: { ...typography.label, color: colors.text },
  actionDetail: { ...typography.small, color: colors.muted },
  pressed: { opacity: animation.opacity.pressed },
});
