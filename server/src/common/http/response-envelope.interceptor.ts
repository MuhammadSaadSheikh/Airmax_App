import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { ServerResponse } from 'node:http';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { isCursorPage } from '../pagination/cursor-pagination';
import { createSuccessEnvelope, type ApiEnvelope } from './api-envelope';
import { RequestContextService } from './request-context.service';
import type { RequestWithId } from './request-id.middleware';

function isUnwrappedResponse(response: ServerResponse): boolean {
  if (response.statusCode === 204) return true;
  const contentType = String(response.getHeader('content-type') ?? '');
  const disposition = String(response.getHeader('content-disposition') ?? '');
  return (
    contentType.startsWith('text/csv') ||
    contentType.startsWith('application/octet-stream') ||
    disposition.toLowerCase().includes('attachment')
  );
}

@Injectable()
export class ResponseEnvelopeInterceptor<T> implements NestInterceptor<
  T,
  T | ApiEnvelope<T>
> {
  constructor(private readonly requestContext: RequestContextService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<T | ApiEnvelope<T>> {
    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithId>();
    const response = http.getResponse<ServerResponse>();

    return next.handle().pipe(
      map(data => {
        if (isUnwrappedResponse(response)) return data;
        const requestId =
          request.requestId ?? this.requestContext.getRequestId() ?? 'unknown';
        if (isCursorPage(data)) {
          return createSuccessEnvelope(data.items, requestId, {
            nextCursor: data.nextCursor,
            hasMore: data.hasMore,
          }) as ApiEnvelope<T>;
        }
        return createSuccessEnvelope(data, requestId);
      }),
    );
  }
}
