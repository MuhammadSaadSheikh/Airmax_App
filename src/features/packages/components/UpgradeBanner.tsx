import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppIcon, AppText, PrimaryButton, Surface } from '@/components';
import type { InternetPackage } from '@/services/packages';
import { colors, spacing, typography } from '@/theme';

function UpgradeBannerComponent({ plan, onUpgrade }: { plan: InternetPackage; onUpgrade: () => void }) {
  return <Surface style={styles.banner}><View style={styles.copy}><AppIcon name="rocket-outline" color={colors.primary} size={24} /><View style={styles.text}><AppText style={styles.title}>Ready for {plan.speed} Mbps?</AppText><AppText style={styles.body}>Upgrade to {plan.name} and unlock every benefit.</AppText></View></View><PrimaryButton title="Upgrade plan" icon="arrow-up-circle-outline" onPress={onUpgrade} /></Surface>;
}

export const UpgradeBanner = memo(UpgradeBannerComponent);

const styles = StyleSheet.create({
  banner: { gap: spacing.md, borderColor: colors.primary },
  copy: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  text: { flex: 1 },
  title: { ...typography.sectionTitle, color: colors.text },
  body: { ...typography.body, color: colors.textSecondary },
});
