import {
  diagnosticService,
  networkHealthService,
  speedTestService,
} from '@/services/network';

describe('Phase 2B network service boundaries', () => {
  it('returns a typed health and equipment snapshot', async () => {
    const result = await networkHealthService.getHealth('AIR-1001');

    expect(result.health.status).toBe('connected');
    expect(result.health.healthScore).toBeGreaterThanOrEqual(0);
    expect(result.health.healthScore).toBeLessThanOrEqual(100);
    expect(result.equipment.routerStatus).toBe('connected');
  });

  it('returns all speed metrics', async () => {
    const result = await speedTestService.run('AIR-1001');

    expect(result).toEqual(
      expect.objectContaining({
        downloadSpeed: expect.any(Number),
        uploadSpeed: expect.any(Number),
        ping: expect.any(Number),
        jitter: expect.any(Number),
        timestamp: expect.any(String),
      }),
    );
  });

  it('returns the complete diagnostic result', async () => {
    const result = await diagnosticService.run('AIR-1001');

    expect(result.internetCheck.status).toBe('healthy');
    expect(result.routerCheck.status).toBe('healthy');
    expect(result.signalCheck).toBeDefined();
    expect(result.latencyCheck).toBeDefined();
    expect(result.recommendation).not.toHaveLength(0);
  });
});
