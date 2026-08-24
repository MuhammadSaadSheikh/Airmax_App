import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { RequestContextService } from './request-context.service';
import { REQUEST_ID_HEADER, resolveRequestId } from './request-id';

export interface RequestWithId extends IncomingMessage {
  requestId?: string;
  originalUrl?: string;
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  constructor(private readonly context: RequestContextService) {}

  use(
    request: RequestWithId,
    response: ServerResponse,
    next: () => void,
  ): void {
    const requestId = resolveRequestId(request.headers[REQUEST_ID_HEADER]);
    request.requestId = requestId;
    response.setHeader(REQUEST_ID_HEADER, requestId);
    this.context.run(requestId, next);
  }
}
