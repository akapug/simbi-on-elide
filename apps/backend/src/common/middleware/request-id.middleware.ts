import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Request ID Middleware
 * Adds a unique request ID to each incoming request
 * Useful for tracing requests across distributed systems and logs
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Use existing request ID from header or generate a new one
    const requestId = (req.headers['x-request-id'] as string) || uuidv4();

    // Add request ID to request object
    (req as any).id = requestId;

    // Add request ID to response headers
    res.setHeader('X-Request-ID', requestId);

    next();
  }
}
