import { StyleSheet, View } from 'react-native';
import { AppIcon, AppText, GradientBackground } from '@/components';
import { colors, gradients, radius, spacing, typography } from '@/theme';

export function SupportHeader() {
  return (
    <GradientBackground
      colors={[...gradients.internetStatus]}
      style={styles.container}
      accessibilityRole="header"
    >
      <View style={styles.icon}>
        <AppIcon name="headset" size={26} color={colors.text} />
      </View>
      <View style={styles.copy}>
        <AppText style={styles.eyebrow}>AIRMAX CARE</AppText>
        <AppText style={styles.title}>How can we help?</AppText>
        <AppText style={styles.subtitle}>
          Smart checks, faster fixes and support that stays with you.
        </AppText>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 178,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    overflow: 'hidden',
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.overlaySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  eyebrow: { ...typography.label, color: colors.textHeroSecondary },
  title: {
    ...typography.screenTitle,
    color: colors.text,
    marginTop: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textHeroSecondary,
    marginTop: spacing.sm,
  },
});
