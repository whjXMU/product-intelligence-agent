export type HealthStatus = 'ok' | 'error';

export interface HealthCheckResponse {
  service: {
    name: string;
    status: HealthStatus;
    uptimeSeconds: number;
    timestamp: string;
  };
  database: {
    status: HealthStatus;
    latencyMs: number | null;
    message: string;
  };
  agent: {
    status: 'reserved';
    message: string;
  };
}
