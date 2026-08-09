import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components';
import type { AnalyticsDataSource } from '@/services/api/reports.models';
import { colors, radius, spacing, typography } from '@/theme';

export function AnalyticsSourceBadge({
  source,
}: {
  source: AnalyticsDataSource;
}) {
  if (source !== 'mock') return null;

  return (
    <View accessibilityLabel="Mock analytics data" style={styles.badge}>
      <AppText style={styles.label}>MOCK DATA</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: `${colors.warning}55`,
    backgroundColor: `${colors.warning}1A`,
  },
  label: {
    ...typography.small,
    color: colors.warning,
    fontFamily: typography.label.fontFamily,
    fontSize: 10,
  },
});
