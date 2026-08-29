import { packageService } from '@/services/packages';

describe('Phase 2C package service', () => {
  it('returns marketplace plans with premium metadata', async () => {
    const plans = await packageService.getPackages();

    expect(plans).toHaveLength(4);
    expect(plans[0]).toEqual(
      expect.objectContaining({
        billingCycle: 'monthly',
        features: expect.any(Array),
        benefits: expect.any(Array),
        usersSupported: expect.any(Number),
        category: expect.any(String),
      }),
    );
  });

  it('returns the current subscription independently of UI models', async () => {
    const clock = jest
      .spyOn(Date, 'now')
      .mockReturnValue(new Date('2026-08-15T00:00:00.000Z').getTime());
    try {
      const current = await packageService.getCurrentPackage('AMX-1042');

      expect(current.subscription.packageId).toBe(current.package.id);
      expect(current.subscription.status).toBe('active');
      expect(current.subscription.remainingDays).toBeGreaterThan(0);
    } finally {
      clock.mockRestore();
    }
  });

  it('builds comparison rows for every selected package', async () => {
    const comparison = await packageService.comparePackages(['basic', 'ultra']);

    expect(comparison.packages.map(plan => plan.id)).toEqual([
      'basic',
      'ultra',
    ]);
    expect(comparison.comparisonFeatures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'speed' }),
        expect.objectContaining({ key: 'support' }),
      ]),
    );
  });

  it('provides explainable mock recommendations', async () => {
    const recommendations = await packageService.getRecommendations('AMX-1042');

    expect(recommendations[0]?.score).toBeGreaterThan(0);
    expect(recommendations[0]?.reason.length).toBeGreaterThan(0);
  });
});
