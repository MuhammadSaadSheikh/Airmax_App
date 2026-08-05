import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppHeader, AppScreen, AppText, ErrorState, PrimaryButton, SkeletonCard, Surface } from '@/components';
import { DiagnosticCheckItem, NetworkRecommendationCard } from '@/features/customer/components';
import { diagnosticService } from '@/services/network';
import { useAuthStore } from '@/store/auth.store';
import { animation, colors, spacing, typography } from '@/theme';

export default function DiagnosticsScreen() {
  const connectionId = useAuthStore(state => state.user?.connectionId ?? 'unknown');
  const mutation = useMutation({ mutationFn: () => diagnosticService.run(connectionId) });
  const run = useCallback(() => mutation.mutate(), [mutation]);
  const checks = mutation.data ? [mutation.data.internetCheck, mutation.data.routerCheck, mutation.data.signalCheck, mutation.data.latencyCheck] : [];

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <AppHeader title="Diagnostics" subtitle="Find common network issues" showBack />
      <Surface style={styles.intro}>
        <AppText style={styles.title}>Network check</AppText>
        <AppText style={styles.body}>We’ll check your internet, router, signal quality and latency.</AppText>
        <PrimaryButton title={mutation.isPending ? 'RUNNING CHECKS…' : mutation.data ? 'RUN AGAIN' : 'RUN NETWORK CHECK'} icon="pulse-outline" onPress={run} loading={mutation.isPending} />
      </Surface>
      {mutation.isPending ? <View style={styles.loading} accessibilityLabel="Running network diagnostics"><SkeletonCard lines={4} /><AppText style={styles.progress}>Checking your network…</AppText></View> : null}
      {mutation.isError ? <ErrorState title="Check failed" message="We couldn't complete the network check." retry={run} /> : null}
      {mutation.data ? <View style={styles.results}>
        <AppText style={styles.sectionTitle}>Diagnosis result</AppText>
        <Surface>{checks.map((check, index) => <DiagnosticCheckItem key={check.label} check={check} delay={index * animation.duration.instant} />)}</Surface>
        <NetworkRecommendationCard recommendation={mutation.data.recommendation} />
      </View> : null}
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
  sectionTitle: { ...typography.sectionTitle, color: colors.text },
});
