export type ConnectionStatus = 'online' | 'offline';
export type EquipmentConnectionStatus = 'connected' | 'disconnected';
export type FiberStatus = 'active' | 'degraded' | 'inactive';

export interface NetworkStatus {
  connectionStatus: ConnectionStatus;
  qualityScore: number;
  latency: number;
  uptime: number;
  routerStatus: EquipmentConnectionStatus;
  fiberStatus: FiberStatus;
  wifiHealthy: boolean;
}

export interface DashboardSpeedMetrics {
  download: number;
  upload: number;
  ping: number;
  jitter: number;
}

export interface UsageStats {
  monthlyUsage: number;
  limit: number;
  percentage: number;
}

export interface CurrentPlan {
  id: string;
  name: string;
  speedMbps: number;
  monthlyPrice: number;
  expiryDate: string;
  remainingDays: number;
  billingCycle?: string;
}

export type ServiceAlertTone = 'info' | 'warning' | 'danger';

export interface ServiceAlert {
  id: string;
  title: string;
  message: string;
  tone: ServiceAlertTone;
  icon: 'construct-outline' | 'receipt-outline' | 'warning-outline';
}

export interface CustomerDashboardSnapshot {
  network: NetworkStatus;
  speed: DashboardSpeedMetrics;
  usage: UsageStats;
  plan: CurrentPlan;
  alerts: ServiceAlert[];
  capturedAt: string;
}

const snapshot: CustomerDashboardSnapshot = {
  network: {
    connectionStatus: 'online',
    qualityScore: 98,
    latency: 12,
    uptime: 99.9,
    routerStatus: 'connected',
    fiberStatus: 'active',
    wifiHealthy: true,
  },
  speed: { download: 94.8, upload: 48.6, ping: 12, jitter: 2.1 },
  usage: { monthlyUsage: 342, limit: 1000, percentage: 34.2 },
  plan: {
    id: 'premium',
    name: 'Premium Fiber',
    speedMbps: 100,
    monthlyPrice: 3500,
    expiryDate: '15 August 2026',
    remainingDays: 11,
  },
  alerts: [
    {
      id: 'maintenance-aug-04',
      title: 'Scheduled maintenance',
      message: 'Maintenance is scheduled tonight from 2:00–3:00 AM.',
      tone: 'info',
      icon: 'construct-outline',
    },
    {
      id: 'bill-aug-07',
      title: 'Bill due soon',
      message: 'Your August bill is due in 3 days.',
      tone: 'warning',
      icon: 'receipt-outline',
    },
  ],
  capturedAt: '2026-08-04T12:00:00.000Z',
};

const copySnapshot = (): CustomerDashboardSnapshot => ({
  ...snapshot,
  network: { ...snapshot.network },
  speed: { ...snapshot.speed },
  usage: { ...snapshot.usage },
  plan: { ...snapshot.plan },
  alerts: snapshot.alerts.map(alert => ({ ...alert })),
});

export const mockNetworkService = {
  async getCustomerDashboard(
    connectionId: string,
  ): Promise<CustomerDashboardSnapshot> {
    // Mirrors an API boundary so NestJS/MikroTik data can replace the mock.
    void connectionId;
    await new Promise<void>(resolve => setTimeout(resolve, 350));
    return copySnapshot();
  },
};
