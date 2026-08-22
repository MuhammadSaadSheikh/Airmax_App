import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon, AppText, Surface, type AppIconName } from '@/components';
import { animation, colors, radius, spacing, typography } from '@/theme';

export type ReportMetric = {
  id: string;
  label: string;
  value: string;
  icon: AppIconName;
  color?: string;
  hint?: string;
};

export function ReportMetricCard({
  metric,
  onPress,
}: {
  metric: ReportMetric;
  onPress?: () => void;
}) {
  const card = (
    <Surface style={styles.card}>
      <View
        style={[
          styles.icon,
          { backgroundColor: `${metric.color ?? colors.primary}1A` },
        ]}
      >
        <AppIcon
          name={metric.icon}
          color={metric.color ?? colors.primary}
          size={20}
        />
      </View>
      <AppText style={styles.label}>{metric.label}</AppText>
      <AppText style={styles.value}>{metric.value}</AppText>
      {metric.hint ? (
        <AppText style={styles.hint}>{metric.hint}</AppText>
      ) : null}
    </Surface>
  );

  if (!onPress) return card;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${metric.label}: ${metric.value}`}
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      {card}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: { width: '100%', height: '100%' },
  pressed: { opacity: animation.opacity.pressed },
  card: { minHeight: 150, height: '100%' },
  icon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  label: { ...typography.small, color: colors.muted },
  value: {
    ...typography.sectionTitle,
    color: colors.text,
    marginTop: spacing.xs,
  },
  hint: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
