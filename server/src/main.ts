import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { createGlobalValidationPipe } from './common/http/validation';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: false,
    bodyParser: false,
  });
  const config = app.get(ConfigService);
  const bodyLimit = config.getOrThrow<number>('REQUEST_BODY_LIMIT_BYTES');
  const apiPrefix = config.getOrThrow<string>('API_PREFIX');
  const port = config.getOrThrow<number>('PORT');
  const logLevel = config.getOrThrow<'error' | 'warn' | 'log' | 'debug'>(
    'LOG_LEVEL',
  );
  const origins = config
    .get<string>('ADMIN_ORIGIN')
    ?.split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

  const logLevels = {
    error: ['error'],
    warn: ['error', 'warn'],
    log: ['error', 'warn', 'log'],
    debug: ['error', 'warn', 'log', 'debug'],
  } as const;
  app.useLogger([...logLevels[logLevel]]);

  app.use(helmet());
  app.useBodyParser('json', { limit: bodyLimit });
  app.useBodyParser('urlencoded', { limit: bodyLimit, extended: false });
  app.enableCors({
    origin: origins?.length ? origins : false,
    credentials: true,
    exposedHeaders: ['X-Request-Id'],
  });
  app.setGlobalPrefix(apiPrefix);
  app.useGlobalPipes(createGlobalValidationPipe());
  app.enableShutdownHooks();
  await app.listen(port, '0.0.0.0');
  Logger.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'log',
      event: 'api.started',
      port,
      apiPrefix,
    }),
    'Bootstrap',
  );
}
void bootstrap();
