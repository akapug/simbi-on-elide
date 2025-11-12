import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * Logging Interceptor
 * Logs all HTTP requests with request ID, timing, and status
 * Provides structured logging for observability
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || 'unknown';
    const requestId = (request as any).id || 'no-request-id';
    const userId = (request as any).user?.id || 'anonymous';

    const now = Date.now();

    // Log incoming request
    this.logger.log({
      message: 'Incoming request',
      method,
      url,
      requestId,
      userId,
      ip,
      userAgent,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const { statusCode } = response;
          const duration = Date.now() - now;

          // Log successful response
          this.logger.log({
            message: 'Request completed',
            method,
            url,
            requestId,
            userId,
            statusCode,
            duration: `${duration}ms`,
          });
        },
        error: (error) => {
          const duration = Date.now() - now;

          // Log error response
          this.logger.error({
            message: 'Request failed',
            method,
            url,
            requestId,
            userId,
            error: error.message,
            duration: `${duration}ms`,
          });
        },
      }),
    );
  }
}
