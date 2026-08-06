import { StyleSheet, View } from 'react-native';
import { AppIcon, AppText, StatusBadge, Surface } from '@/components';
import type { CustomerInsight } from '@/services/notifications/models';
import { colors, radius, spacing, typography } from '@/theme';

export function SmartSuggestionCard({ insight }: { insight: CustomerInsight }) {
  return (
    <Surface style={styles.card}>
      <View style={styles.icon}>
        <AppIcon name="analytics-outline" size={23} color={colors.purple} />
      </View>
      <View style={styles.copy}>
        <View style={styles.header}>
          <AppText style={styles.title}>Smart insight</AppText>
          <StatusBadge
            label={`${insight.riskLevel} priority`}
            tone={insight.riskLevel === 'high' ? 'danger' : 'info'}
          />
        </View>
        <AppText style={styles.body}>{insight.usagePattern}</AppText>
        <AppText style={styles.suggestion}>{insight.packageSuggestion}</AppText>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: spacing.md },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: `${colors.purple}1A`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: { ...typography.sectionTitle, color: colors.text },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  suggestion: {
    ...typography.label,
    color: colors.purple,
    marginTop: spacing.sm,
  },
});
