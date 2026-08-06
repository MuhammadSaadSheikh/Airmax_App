import type { DiagnosticResult } from './models';

export interface SupportDiagnosticService {
  runDiagnostics(
    connectionId: string,
    issue?: string,
  ): Promise<DiagnosticResult>;
}

export const supportDiagnosticService: SupportDiagnosticService = {
  async runDiagnostics(connectionId, issue) {
    // The NestJS endpoint can later forward this context to the AI support engine.
    void connectionId;
    void issue;
    await new Promise<void>(resolve => setTimeout(resolve, 1600));
    return {
      internetStatus: 'connected',
      routerStatus: 'healthy',
      networkStatus: 'healthy',
      latencyStatus: 'high',
      latencyMs: 84,
      recommendation:
        'Restart your router, wait 60 seconds, then run the check again.',
      checkedAt: new Date().toISOString(),
    };
  },
};

export const runDiagnostics = (connectionId: string, issue?: string) =>
  supportDiagnosticService.runDiagnostics(connectionId, issue);
