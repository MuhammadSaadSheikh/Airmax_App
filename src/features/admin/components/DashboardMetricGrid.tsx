import { StyleSheet, View } from 'react-native';
import { StatCard, type AppIconName } from '@/components';
import type { DashboardSummary } from '@/services/api/reports.service';
import { colors, money, spacing } from '@/theme';

type Metric = {
  id: string;
  icon: AppIconName;
  label: string;
  value: string;
  color: string;
};

export function DashboardMetricGrid({
  summary,
}: {
  summary: DashboardSummary;
}) {
  const metrics: Metric[] = [
    {
      id: 'total-users',
      icon: 'people-outline',
      label: 'Total users',
      value: summary.totalUsers.toLocaleString('en-PK'),
      color: colors.primary,
    },
    {
      id: 'active-users',
      icon: 'wifi-outline',
      label: 'Active users',
      value: summary.activeUsers.toLocaleString('en-PK'),
      color: colors.success,
    },
    {
      id: 'offline-users',
      icon: 'cloud-offline-outline',
      label: 'Offline users',
      value: summary.offlineUsers.toLocaleString('en-PK'),
      color: colors.danger,
    },
    {
      id: 'revenue',
      icon: 'cash-outline',
      label: 'Monthly revenue',
      value: money(summary.currentMonthRevenue),
      color: colors.success,
    },
    {
      id: 'pending-payments',
      icon: 'time-outline',
      label: 'Pending payments',
      value: money(summary.pendingPayments),
      color: colors.warning,
    },
    {
      id: 'open-complaints',
      icon: 'chatbox-ellipses-outline',
      label: 'Open complaints',
      value: summary.openComplaints.toLocaleString('en-PK'),
      color: colors.danger,
    },
  ];

  return (
    <View style={styles.grid}>
      {metrics.map(metric => (
        <StatCard
          key={metric.id}
          icon={metric.icon}
          label={metric.label}
          value={metric.value}
          color={metric.color}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
});
