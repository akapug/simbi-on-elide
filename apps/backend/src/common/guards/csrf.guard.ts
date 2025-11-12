import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { CsrfService } from '../services/csrf.service';

export const SKIP_CSRF_KEY = 'skipCsrf';
export const SkipCsrf = () => SetMetadata(SKIP_CSRF_KEY, true);

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(
    private csrfService: CsrfService,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if CSRF should be skipped for this route
    const skipCsrf = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipCsrf) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method.toUpperCase();

    // Only check CSRF for state-changing methods
    const statChangingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
    if (!statChangingMethods.includes(method)) {
      return true;
    }

    // Get CSRF token from header
    const csrfToken =
      request.headers['x-csrf-token'] ||
      request.headers['x-xsrf-token'] ||
      (request.body && request.body._csrf);

    // Get CSRF cookie value
    const csrfCookie = request.cookies['XSRF-TOKEN'];

    // Validate the token
    if (!this.csrfService.validateToken(csrfToken as string, csrfCookie)) {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'Invalid CSRF token',
        error: 'CSRF_VALIDATION_FAILED',
      });
    }

    return true;
  }
}
