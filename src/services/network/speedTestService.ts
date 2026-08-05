import type { SpeedMetrics } from './models';

export interface SpeedTestService {
  run(connectionId: string): Promise<SpeedMetrics>;
}

export const speedTestService: SpeedTestService = {
  async run(connectionId) {
    // Simulates a backend-managed test. The mobile client never talks to a router.
    void connectionId;
    await new Promise<void>(resolve => setTimeout(resolve, 2200));
    return {
      downloadSpeed: 95,
      uploadSpeed: 48,
      ping: 10,
      jitter: 3,
      timestamp: new Date().toISOString(),
    };
  },
};
