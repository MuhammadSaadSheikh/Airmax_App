import type { EquipmentStatus, NetworkHealth, SpeedMetrics } from './models';

export interface NetworkHealthSnapshot {
  health: NetworkHealth;
  equipment: EquipmentStatus;
  speed: SpeedMetrics;
}

export interface NetworkHealthService {
  getHealth(connectionId: string): Promise<NetworkHealthSnapshot>;
}

const snapshot: NetworkHealthSnapshot = {
  health: {
    status: 'connected',
    quality: 'excellent',
    healthScore: 98,
    latency: 12,
    jitter: 3,
    uptime: 99.9,
    connectedSince: '12 days',
    lastChecked: '2 minutes ago',
    areaIssue: false,
  },
  equipment: {
    routerStatus: 'connected',
    fiberStatus: 'active',
    wifiStatus: 'healthy',
  },
  speed: {
    downloadSpeed: 100,
    uploadSpeed: 50,
    ping: 12,
    jitter: 3,
    timestamp: '2026-08-05T12:00:00.000Z',
  },
};

export const networkHealthService: NetworkHealthService = {
  async getHealth(connectionId) {
    // This boundary can be backed by NestJS/network monitoring without UI changes.
    void connectionId;
    await new Promise<void>(resolve => setTimeout(resolve, 300));
    return {
      health: { ...snapshot.health },
      equipment: { ...snapshot.equipment },
      speed: { ...snapshot.speed },
    };
  },
};
