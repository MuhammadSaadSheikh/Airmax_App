export type NetworkConnectionStatus = 'connected' | 'disconnected';
export type NetworkQuality = 'excellent' | 'good' | 'fair' | 'poor';
export type CheckStatus = 'healthy' | 'warning' | 'failed';

export interface NetworkHealth {
  status: NetworkConnectionStatus;
  quality: NetworkQuality;
  healthScore: number;
  latency: number;
  jitter: number;
  uptime: number;
  connectedSince: string;
  lastChecked: string;
  areaIssue: boolean;
}

export interface SpeedMetrics {
  downloadSpeed: number;
  uploadSpeed: number;
  ping: number;
  jitter: number;
  timestamp: string;
}

export interface EquipmentStatus {
  routerStatus: NetworkConnectionStatus;
  fiberStatus: 'active' | 'degraded' | 'inactive';
  wifiStatus: CheckStatus;
}

export interface DiagnosticCheck {
  status: CheckStatus;
  label: string;
  detail: string;
}

export interface DiagnosticResult {
  internetCheck: DiagnosticCheck;
  routerCheck: DiagnosticCheck;
  signalCheck: DiagnosticCheck;
  latencyCheck: DiagnosticCheck;
  recommendation: string;
  timestamp: string;
}

export type SpeedTestState = 'idle' | 'testing' | 'completed' | 'failed';
