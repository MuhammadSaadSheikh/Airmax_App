import { useNavigation } from '@react-navigation/native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
import { AppIcon } from './AppIcon';
import { AppText } from './AppText';

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  showBack?: boolean;
};

export function AppHeader({
  title,
  subtitle,
  action,
  showBack,
}: AppHeaderProps) {
  const navigation = useNavigation();
  const canGoBack = showBack ?? navigation.canGoBack();

  return (
    <View style={styles.header}>
      {canGoBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <AppIcon name="arrow-back" size={23} />
        </Pressable>
      ) : null}
      <View style={styles.copy}>
        <AppText style={styles.title}>{title}</AppText>
        {subtitle ? (
          <AppText style={styles.subtitle}>{subtitle}</AppText>
        ) : null}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.screenTop,
    paddingBottom: spacing.lg + spacing.xxs,
  },
  copy: { flex: 1 },
  title: { ...typography.screenTitle, color: colors.text, letterSpacing: -0.6 },
  subtitle: { ...typography.label, color: colors.muted, marginTop: spacing.xs },
  back: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.7 },
});
