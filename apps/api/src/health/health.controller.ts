import { Controller, Get } from '@nestjs/common';
import type { HealthCheckResponse } from '@ai-product-agent/shared';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async check(): Promise<HealthCheckResponse> {
    return this.healthService.check();
  }
}
