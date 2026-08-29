import { environment } from '@/config/environment';
import type { DiagnosticResult } from './models';

export interface DiagnosticService {
  run(connectionId: string): Promise<DiagnosticResult>;
}

export const diagnosticService: DiagnosticService = {
  async run(connectionId) {
    if (!environment.useMockApi) {
      throw new Error('Diagnostics are unavailable in live mode.');
    }
    // Future implementations can delegate these checks to NestJS/MikroTik.
    void connectionId;
    await new Promise<void>(resolve => setTimeout(resolve, 1600));
    return {
      internetCheck: {
        status: 'healthy',
        label: 'Internet connection',
        detail: 'Working normally',
      },
      routerCheck: {
        status: 'healthy',
        label: 'Router status',
        detail: 'Connected and responsive',
      },
      signalCheck: {
        status: 'healthy',
        label: 'Signal quality',
        detail: 'Strong signal',
      },
      latencyCheck: {
        status: 'warning',
        label: 'Latency check',
        detail: 'Higher than usual',
      },
      recommendation: 'Restart your router if pages continue to feel slow.',
      timestamp: new Date().toISOString(),
    };
  },
};
