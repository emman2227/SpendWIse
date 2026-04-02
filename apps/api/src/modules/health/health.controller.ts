import { Controller, Get, VERSION_NEUTRAL, Version } from '@nestjs/common';

import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Version(VERSION_NEUTRAL)
  getHealth() {
    return this.healthService.getStatus();
  }
}
