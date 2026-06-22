import { Injectable } from '@nestjs/common';
import type { HealthCheckResponse } from '@product-intelligence-agent/shared';
import { DataSource } from 'typeorm';

@Injectable()
export class HealthService {
  constructor(private readonly dataSource: DataSource) {}

  async check(): Promise<HealthCheckResponse> {
    const startedAt = Date.now();

    try {
      await this.dataSource.query('SELECT 1');

      return {
        service: this.getServiceStatus(),
        database: {
          status: 'ok',
          latencyMs: Date.now() - startedAt,
          message: 'PostgreSQL 连接正常',
        },
        agent: {
          status: 'reserved',
          message: 'Agent 核心能力已预留，当前 MVP V0 尚未启用复杂推理。',
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知数据库错误';

      return {
        service: this.getServiceStatus(),
        database: {
          status: 'error',
          latencyMs: null,
          message,
        },
        agent: {
          status: 'reserved',
          message: 'Agent 核心能力已预留，当前 MVP V0 尚未启用复杂推理。',
        },
      };
    }
  }

  private getServiceStatus(): HealthCheckResponse['service'] {
    return {
      name: 'product-intelligence-agent-api',
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
