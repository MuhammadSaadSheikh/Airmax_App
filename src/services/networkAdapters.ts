export interface NetworkSubscriber { connectionId: string; username: string; profile: string; enabled: boolean; }
export interface UsageSnapshot { downstreamMbps: number; upstreamMbps: number; online: boolean; capturedAt: string; }
export interface NetworkAdapter {
  provision(subscriber: NetworkSubscriber): Promise<void>;
  suspend(connectionId: string): Promise<void>;
  restore(connectionId: string): Promise<void>;
  usage(connectionId: string): Promise<UsageSnapshot>;
}

export class UnsupportedNetworkAdapter implements NetworkAdapter {
  private error(): never { throw new Error('Configure a MikroTik or OLT adapter on the secure backend.'); }
  async provision(): Promise<void> { this.error(); }
  async suspend(): Promise<void> { this.error(); }
  async restore(): Promise<void> { this.error(); }
  async usage(): Promise<UsageSnapshot> { return this.error(); }
}
