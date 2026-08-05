import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppIcon, AppText } from '@/components';
import { colors, spacing, typography } from '@/theme';

function FeatureListComponent({ features, limit }: { features: string[]; limit?: number }) {
  const visible = limit ? features.slice(0, limit) : features;
  return <View style={styles.list}>{visible.map(feature => <View key={feature} style={styles.row}><AppIcon name="checkmark-circle" color={colors.success} size={18} /><AppText style={styles.text}>{feature}</AppText></View>)}</View>;
}

export const FeatureList = memo(FeatureListComponent);

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  text: { ...typography.body, color: colors.textSecondary, flex: 1 },
});
