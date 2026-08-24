import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { ServerResponse } from 'node:http';
import type { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { classifyException } from './api-exception.filter';
import { RequestContextService } from './request-context.service';
import type { RequestWithId } from './request-id.middleware';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HttpRequest');

  constructor(private readonly requestContext: RequestContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startedAt = process.hrtime.bigint();
    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithId>();
    const response = http.getResponse<ServerResponse>();
    const requestId =
      request.requestId ?? this.requestContext.getRequestId() ?? 'unknown';

    const log = (statusCode: number, level: 'info' | 'error') => {
      const durationMs =
        Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      const entry = JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        requestId,
        method: request.method,
        route: request.originalUrl ?? request.url,
        statusCode,
        durationMs: Number(durationMs.toFixed(3)),
      });
      if (level === 'error') this.logger.error(entry);
      else this.logger.log(entry);
    };

    return next.handle().pipe(
      tap(() => log(response.statusCode, 'info')),
      catchError(error => {
        log(classifyException(error).status, 'error');
        throw error;
      }),
    );
  }
}
