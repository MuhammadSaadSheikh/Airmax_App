import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppIcon, AppText, Surface } from '@/components';
import { colors, spacing, typography } from '@/theme';

function NetworkRecommendationCardComponent({ recommendation }: { recommendation: string }) {
  return (
    <Surface accessibilityLabel={`Recommendation: ${recommendation}`} style={styles.surface}>
      <AppIcon name="bulb-outline" color={colors.warning} size={23} />
      <View style={styles.copy}><AppText style={styles.label}>RECOMMENDATION</AppText><AppText style={styles.text}>{recommendation}</AppText></View>
    </Surface>
  );
}

export const NetworkRecommendationCard = memo(NetworkRecommendationCardComponent);

const styles = StyleSheet.create({
  surface: { flexDirection: 'row', gap: spacing.md, borderColor: colors.warning },
  copy: { flex: 1, gap: spacing.xs },
  label: { ...typography.small, color: colors.warning },
  text: { ...typography.body, color: colors.text },
});
