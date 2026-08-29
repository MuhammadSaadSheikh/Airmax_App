import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import {
  AppHeader,
  AppScreen,
  AppText,
  ErrorState,
  PrimaryButton,
  SecondaryButton,
  SkeletonCard,
  Surface,
} from '@/components';
import { environment } from '@/config/environment';
import {
  DiagnosticCheckItem,
  NetworkRecommendationCard,
} from '@/features/customer/components';
import type { CustomerStackParamList } from '@/navigation/types';
import type { DiagnosticCheck } from '@/services/network';
import { supportDiagnosticService } from '@/services/support';
import { useAuthStore } from '@/store/auth.store';
import { animation, colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<CustomerStackParamList, 'Diagnostics'>;

export default function DiagnosticsScreen({ navigation, route }: Props) {
  const connectionId = useAuthStore(
    state => state.user?.connectionId ?? 'unknown',
  );
  const mutation = useMutation({
    mutationFn: () =>
      supportDiagnosticService.runDiagnostics(
        connectionId,
        route.params?.issueType,
      ),
  });
  const run = useCallback(() => mutation.mutate(), [mutation]);
  const checks: DiagnosticCheck[] = mutation.data
    ? [
        {
          label: 'Internet connection',
          status:
            mutation.data.internetStatus === 'connected' ? 'healthy' : 'failed',
          detail:
            mutation.data.internetStatus === 'connected'
              ? 'Connected'
              : 'Connection unavailable',
        },
        {
          label: 'Router status',
          status:
            mutation.data.routerStatus === 'healthy' ? 'healthy' : 'warning',
          detail:
            mutation.data.routerStatus === 'healthy'
              ? 'Healthy and responsive'
              : 'Needs attention',
        },
        {
          label: 'Network status',
          status:
            mutation.data.networkStatus === 'healthy' ? 'healthy' : 'warning',
          detail:
            mutation.data.networkStatus === 'healthy'
              ? 'No area outage detected'
              : 'Service degradation detected',
        },
        {
          label: 'Latency check',
          status:
            mutation.data.latencyStatus === 'high' ? 'warning' : 'healthy',
          detail: `${mutation.data.latencyMs} ms · ${mutation.data.latencyStatus === 'high' ? 'Higher than usual' : 'Normal'}`,
        },
      ]
    : [];

  if (!environment.useMockApi) {
    return (
      <AppScreen contentContainerStyle={styles.content}>
        <AppHeader title="Diagnostics" showBack />
        <ErrorState
          title="Diagnostics unavailable"
          message="Live diagnostics require a secure backend monitoring contract. No mock diagnostic result is shown in live mode."
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <AppHeader
        title="Diagnostics"
        subtitle="Find common network issues"
        showBack
      />
      <Surface style={styles.intro}>
        <AppText style={styles.title}>Network check</AppText>
        <AppText style={styles.body}>
          We’ll check your internet, router, local network and latency.
        </AppText>
        <PrimaryButton
          title={
            mutation.isPending
              ? 'RUNNING CHECKS…'
              : mutation.data
                ? 'RUN AGAIN'
                : 'RUN NETWORK CHECK'
          }
          icon="pulse-outline"
          onPress={run}
          loading={mutation.isPending}
        />
      </Surface>
      {mutation.isPending ? (
        <View
          style={styles.loading}
          accessibilityLabel="Running network diagnostics"
        >
          <SkeletonCard lines={4} />
          <AppText style={styles.progress}>Checking your network…</AppText>
        </View>
      ) : null}
      {mutation.isError ? (
        <ErrorState
          title="Check failed"
          message="We couldn't complete the network check."
          retry={run}
        />
      ) : null}
      {mutation.data ? (
        <View style={styles.results}>
          <AppText style={styles.sectionTitle}>Diagnosis result</AppText>
          <Surface>
            {checks.map((check, index) => (
              <DiagnosticCheckItem
                key={check.label}
                check={check}
                delay={index * animation.duration.instant}
              />
            ))}
          </Surface>
          <NetworkRecommendationCard
            recommendation={mutation.data.recommendation}
          />
          <View style={styles.actions}>
            <PrimaryButton
              title="CREATE TICKET"
              icon="ticket-outline"
              onPress={() => navigation.navigate('CreateComplaint')}
            />
            <SecondaryButton
              title="CONTACT SUPPORT"
              icon="chatbubble-ellipses-outline"
              onPress={() =>
                Alert.alert(
                  'AIRMAX support',
                  'Live support integration is ready for the support API.',
                )
              }
            />
          </View>
        </View>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.huge, gap: spacing.lg },
  intro: { gap: spacing.sm },
  title: { ...typography.sectionTitle, color: colors.text },
  body: { ...typography.body, color: colors.textSecondary },
  loading: { gap: spacing.md },
  progress: { ...typography.label, color: colors.primary, textAlign: 'center' },
  results: { gap: spacing.md },
  actions: { gap: spacing.sm },
  sectionTitle: { ...typography.sectionTitle, color: colors.text },
});
