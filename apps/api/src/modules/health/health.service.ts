import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  getStatus() {
    return {
      status: 'ok',
      service: 'spendwise-api',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }
}
