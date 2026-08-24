import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import type { ServerResponse } from 'node:http';
import { ApiException } from './api-exception';
import { createErrorEnvelope, type ApiErrorItem } from './api-envelope';
import { RequestContextService } from './request-context.service';
import type { RequestWithId } from './request-id.middleware';

interface HttpResponseLike extends ServerResponse {
  status(code: number): this;
  json(body: unknown): this;
}

interface ClassifiedError {
  status: number;
  error: ApiErrorItem;
}

const STATUS_CODES: Partial<Record<number, string>> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'AUTHENTICATION_ERROR',
  [HttpStatus.FORBIDDEN]: 'AUTHORIZATION_ERROR',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMITED',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'INFRASTRUCTURE_ERROR',
};

function safeHttpMessage(exception: HttpException, status: number): string {
  if (status >= 500) return 'The service could not complete the request';
  const response = exception.getResponse();
  if (typeof response === 'string') return response;
  if (response && typeof response === 'object' && 'message' in response) {
    const message = (response as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return exception.message || 'Request failed';
}

function prismaCode(exception: unknown): string | undefined {
  if (!exception || typeof exception !== 'object' || !('code' in exception)) {
    return undefined;
  }
  const code = (exception as { code?: unknown }).code;
  return typeof code === 'string' && /^P\d{4}$/.test(code) ? code : undefined;
}

function isPrismaInfrastructureError(exception: unknown): boolean {
  if (!exception || typeof exception !== 'object') return false;
  const name = (exception as { constructor?: { name?: string } }).constructor
    ?.name;
  return (
    Boolean(name?.startsWith('PrismaClient')) || Boolean(prismaCode(exception))
  );
}

export function classifyException(exception: unknown): ClassifiedError {
  if (exception instanceof ApiException) {
    return {
      status: exception.getStatus(),
      error: {
        code: exception.code,
        message: exception.message,
        ...(exception.details === undefined
          ? {}
          : { details: exception.details }),
      },
    };
  }

  const databaseCode = prismaCode(exception);
  if (databaseCode === 'P2002') {
    return {
      status: HttpStatus.CONFLICT,
      error: { code: 'CONFLICT', message: 'The resource already exists' },
    };
  }
  if (databaseCode === 'P2025') {
    return {
      status: HttpStatus.NOT_FOUND,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found',
      },
    };
  }
  if (isPrismaInfrastructureError(exception)) {
    return {
      status: HttpStatus.SERVICE_UNAVAILABLE,
      error: {
        code: 'DATABASE_ERROR',
        message: 'A required data service is unavailable',
      },
    };
  }
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    return {
      status,
      error: {
        code: STATUS_CODES[status] ?? 'HTTP_ERROR',
        message: safeHttpMessage(exception, status),
      },
    };
  }
  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  };
}

@Catch()
@Injectable()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  constructor(private readonly requestContext: RequestContextService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<RequestWithId>();
    const response = http.getResponse<HttpResponseLike>();
    const requestId =
      request.requestId ?? this.requestContext.getRequestId() ?? 'unknown';
    const classified = classifyException(exception);

    this.logger.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        requestId,
        method: request.method,
        route: request.originalUrl ?? request.url,
        statusCode: classified.status,
        errorCode: classified.error.code,
      }),
    );

    response
      .status(classified.status)
      .json(createErrorEnvelope([classified.error], requestId));
  }
}
