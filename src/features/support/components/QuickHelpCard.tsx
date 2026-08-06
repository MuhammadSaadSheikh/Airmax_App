import { Pressable, StyleSheet } from 'react-native';
import { AppIcon, AppText, Surface, type AppIconName } from '@/components';
import { animation, colors, radius, spacing, typography } from '@/theme';

type QuickHelpCardProps = {
  icon: AppIconName;
  title: string;
  subtitle: string;
  onPress: () => void;
};

export function QuickHelpCard({
  icon,
  title,
  subtitle,
  onPress,
}: QuickHelpCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      onPress={onPress}
      style={({ pressed }) => [styles.wrapper, pressed && styles.pressed]}
    >
      <Surface style={styles.card}>
        <AppIcon name={icon} size={24} color={colors.primary} />
        <AppText style={styles.title}>{title}</AppText>
        <AppText style={styles.subtitle}>{subtitle}</AppText>
        <AppIcon name="arrow-forward" size={18} color={colors.primary} />
      </Surface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  card: { minHeight: 154, gap: spacing.sm, borderRadius: radius.xl },
  title: { ...typography.label, color: colors.text },
  subtitle: { ...typography.small, color: colors.muted, flex: 1 },
  pressed: { opacity: animation.opacity.pressed },
});
