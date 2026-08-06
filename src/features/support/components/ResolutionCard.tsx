import { StyleSheet, View } from 'react-native';
import Animated, { BounceIn } from 'react-native-reanimated';
import { AppIcon, AppText, Surface } from '@/components';
import { animation, colors, radius, spacing, typography } from '@/theme';

export function ResolutionCard({ resolution }: { resolution: string }) {
  return (
    <Animated.View entering={BounceIn.duration(animation.duration.slow)}>
      <Surface
        style={styles.card}
        accessibilityLabel={`Issue resolved. ${resolution}`}
      >
        <View style={styles.icon}>
          <AppIcon name="checkmark" size={24} color={colors.textOnAccent} />
        </View>
        <View style={styles.copy}>
          <AppText style={styles.title}>Issue resolved</AppText>
          <AppText style={styles.body}>{resolution}</AppText>
        </View>
      </Surface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: spacing.md, borderColor: colors.success },
  icon: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  title: { ...typography.sectionTitle, color: colors.success },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
