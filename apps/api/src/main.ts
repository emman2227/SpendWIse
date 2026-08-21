import dns from 'node:dns';

import { Logger, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';

// Ensure Node.js can resolve MongoDB Atlas SRV records across various network/router DNS setups
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // Use system default DNS if setServers is unavailable
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  Logger.log(`SpendWise API listening on http://localhost:${port}/api/v1`, 'Bootstrap');
}

bootstrap();
