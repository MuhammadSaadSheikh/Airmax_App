import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ApiExceptionFilter } from './api-exception.filter';
import { HttpLoggingInterceptor } from './http-logging.interceptor';
import { RequestContextService } from './request-context.service';
import { RequestIdMiddleware } from './request-id.middleware';
import { ResponseEnvelopeInterceptor } from './response-envelope.interceptor';

@Global()
@Module({
  providers: [
    RequestContextService,
    RequestIdMiddleware,
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: HttpLoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ResponseEnvelopeInterceptor },
  ],
  exports: [RequestContextService, RequestIdMiddleware],
})
export class HttpFoundationModule {}
