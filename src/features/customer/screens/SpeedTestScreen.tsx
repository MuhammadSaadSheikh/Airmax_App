import { useMutation } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { AppHeader, AppIcon, AppScreen, AppText, PrimaryButton, SecondaryButton, Surface } from '@/components';
import { SpeedResultCard, SpeedTestGauge, TestingAnimation } from '@/features/customer/components';
import { speedTestService, type SpeedMetrics } from '@/services/network';
import { useAuthStore } from '@/store/auth.store';
import { animation, colors, radius, spacing, typography } from '@/theme';

export default function SpeedTestScreen() {
  const connectionId = useAuthStore(state => state.user?.connectionId ?? 'unknown');
  const [result, setResult] = useState<SpeedMetrics | null>(null);
  const mutation = useMutation({
    mutationFn: () => speedTestService.run(connectionId),
    onSuccess: setResult,
  });
  const start = useCallback(() => { setResult(null); mutation.mutate(); }, [mutation]);
  const state = mutation.isPending ? 'testing' : mutation.isError ? 'failed' : result ? 'completed' : 'idle';
  const gaugeValue = result?.downloadSpeed ?? 0;

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <AppHeader title="Speed test" subtitle="Measure your connection performance" showBack />
      <Surface style={styles.hero}>
        <SpeedTestGauge state={state} value={gaugeValue} />
        {mutation.isPending ? <TestingAnimation label="Checking connection…" /> : result ? (
          <Animated.View entering={ZoomIn.duration(animation.duration.normal)} style={styles.success}>
            <View style={styles.successIcon}><AppIcon name="checkmark" color={colors.textOnAccent} size={20} /></View>
            <AppText style={styles.successText}>Test completed</AppText>
          </Animated.View>
        ) : mutation.isError ? <AppText accessibilityLiveRegion="assertive" style={styles.error}>Test failed. Check your connection and try again.</AppText> : <AppText style={styles.hint}>Ready to test your internet speed</AppText>}
        <PrimaryButton title={mutation.isPending ? 'TESTING…' : result ? 'TEST AGAIN' : 'START TEST'} onPress={start} loading={mutation.isPending} />
      </Surface>
      {result ? <SpeedResultCard result={result} /> : null}
      {mutation.isError ? <Animated.View entering={FadeIn}><SecondaryButton title="TRY AGAIN" onPress={start} /></Animated.View> : null}
      <View style={styles.note}><AppIcon name="information-circle-outline" color={colors.muted} size={19} /><AppText style={styles.noteText}>Results are mock data in Phase 2B and are saved for this session.</AppText></View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.huge, gap: spacing.lg },
  hero: { gap: spacing.lg },
  success: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  successIcon: { width: spacing.huge, height: spacing.huge, borderRadius: radius.pill, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  successText: { ...typography.label, color: colors.success },
  error: { ...typography.body, color: colors.danger, textAlign: 'center' },
  hint: { ...typography.body, color: colors.muted, textAlign: 'center' },
  note: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  noteText: { ...typography.small, color: colors.muted, flex: 1 },
});
