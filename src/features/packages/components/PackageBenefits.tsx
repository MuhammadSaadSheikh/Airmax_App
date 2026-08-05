import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppIcon, AppText, Surface } from '@/components';
import { colors, radius, spacing, typography } from '@/theme';

function PackageBenefitsComponent({ benefits }: { benefits: string[] }) {
  return <View style={styles.grid}>{benefits.map((benefit, index) => <Surface key={benefit} style={styles.item}><View style={styles.icon}><AppIcon name={index === 0 ? 'flash-outline' : index === 1 ? 'tv-outline' : 'shield-checkmark-outline'} color={colors.primary} size={20} /></View><AppText style={styles.text}>{benefit}</AppText></Surface>)}</View>;
}

export const PackageBenefits = memo(PackageBenefitsComponent);

const styles = StyleSheet.create({
  grid: { gap: spacing.sm },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  icon: { width: spacing.huge, height: spacing.huge, borderRadius: radius.sm, backgroundColor: colors.surfaceAccent, alignItems: 'center', justifyContent: 'center' },
  text: { ...typography.label, color: colors.text, flex: 1 },
});
