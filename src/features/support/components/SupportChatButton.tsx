import { Pressable, StyleSheet } from 'react-native';
import { AppIcon, AppText } from '@/components';
import {
  animation,
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from '@/theme';

export function SupportChatButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Contact AIRMAX support"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <AppIcon name="chatbubbles" size={21} color={colors.textOnAccent} />
      <AppText style={styles.label}>Chat with support</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    ...shadows.glow,
  },
  label: { ...typography.button, color: colors.textOnAccent },
  pressed: { opacity: animation.opacity.pressed },
});
