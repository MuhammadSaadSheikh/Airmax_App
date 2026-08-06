import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon, AppText, Surface } from '@/components';
import { animation, colors, radius, spacing, typography } from '@/theme';

export function DiagnosticCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Run smart network diagnostics"
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Surface style={styles.card}>
        <View style={styles.icon}>
          <AppIcon name="pulse" size={26} color={colors.primary} />
        </View>
        <View style={styles.copy}>
          <AppText style={styles.label}>SMART DIAGNOSTICS</AppText>
          <AppText style={styles.title}>Check your connection</AppText>
          <AppText style={styles.subtitle}>Internet · Router · Network</AppText>
        </View>
        <AppIcon name="chevron-forward" color={colors.primary} />
      </Surface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceStrong,
    borderColor: colors.borderStrong,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAccent,
  },
  copy: { flex: 1 },
  label: { ...typography.small, color: colors.primary },
  title: {
    ...typography.sectionTitle,
    color: colors.text,
    marginTop: spacing.xxs,
  },
  subtitle: { ...typography.small, color: colors.muted, marginTop: spacing.xs },
  pressed: { opacity: animation.opacity.pressed },
});
