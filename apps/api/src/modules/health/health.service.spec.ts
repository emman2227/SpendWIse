import { Test } from '@nestjs/testing';

import { HealthService } from './health.service';

describe('HealthService', () => {
  it('returns an ok status payload', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [HealthService]
    }).compile();

    const service = moduleRef.get(HealthService);
    const payload = service.getStatus();

    expect(payload.status).toBe('ok');
  });
});
