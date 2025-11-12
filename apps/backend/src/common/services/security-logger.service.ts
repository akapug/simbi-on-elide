import { Injectable, Logger } from '@nestjs/common';
import { SecurityEvent, SecurityEventType } from '../config/logger.config';

/**
 * Security Logger Service
 * Centralized service for logging security-related events
 * Used for audit trails and security monitoring
 */
@Injectable()
export class SecurityLoggerService {
  private readonly logger = new Logger(SecurityLoggerService.name);

  /**
   * Log a security event
   */
  logSecurityEvent(event: SecurityEvent) {
    const logData = {
      type: event.type,
      userId: event.userId || 'anonymous',
      email: event.email || 'unknown',
      ip: event.ip || 'unknown',
      userAgent: event.userAgent || 'unknown',
      timestamp: new Date().toISOString(),
      ...event.metadata,
    };

    // Log at appropriate level based on event type
    if (this.isHighSeverityEvent(event.type)) {
      this.logger.warn(`Security Event: ${event.type}`, logData);
    } else {
      this.logger.log(`Security Event: ${event.type}`, logData);
    }

    // In production, you might want to send these to a SIEM system
    // or security monitoring service like Datadog, Splunk, etc.
  }

  /**
   * Log successful login
   */
  logLoginSuccess(userId: string, email: string, ip: string, userAgent: string) {
    this.logSecurityEvent({
      type: SecurityEventType.LOGIN_SUCCESS,
      userId,
      email,
      ip,
      userAgent,
    });
  }

  /**
   * Log failed login attempt
   */
  logLoginFailure(email: string, ip: string, userAgent: string, reason?: string) {
    this.logSecurityEvent({
      type: SecurityEventType.LOGIN_FAILURE,
      email,
      ip,
      userAgent,
      metadata: { reason },
    });
  }

  /**
   * Log password change
   */
  logPasswordChange(userId: string, email: string, ip: string, userAgent: string) {
    this.logSecurityEvent({
      type: SecurityEventType.PASSWORD_CHANGE,
      userId,
      email,
      ip,
      userAgent,
    });
  }

  /**
   * Log password reset request
   */
  logPasswordResetRequest(email: string, ip: string, userAgent: string) {
    this.logSecurityEvent({
      type: SecurityEventType.PASSWORD_RESET_REQUEST,
      email,
      ip,
      userAgent,
    });
  }

  /**
   * Log OAuth login
   */
  logOAuthLogin(
    userId: string,
    email: string,
    provider: string,
    ip: string,
    userAgent: string,
  ) {
    this.logSecurityEvent({
      type: SecurityEventType.OAUTH_LOGIN,
      userId,
      email,
      ip,
      userAgent,
      metadata: { provider },
    });
  }

  /**
   * Log rate limit exceeded
   */
  logRateLimitExceeded(ip: string, userAgent: string, endpoint: string) {
    this.logSecurityEvent({
      type: SecurityEventType.RATE_LIMIT_EXCEEDED,
      ip,
      userAgent,
      metadata: { endpoint },
    });
  }

  /**
   * Log permission denied
   */
  logPermissionDenied(
    userId: string,
    resource: string,
    action: string,
    ip: string,
    userAgent: string,
  ) {
    this.logSecurityEvent({
      type: SecurityEventType.PERMISSION_DENIED,
      userId,
      ip,
      userAgent,
      metadata: { resource, action },
    });
  }

  /**
   * Log suspicious activity
   */
  logSuspiciousActivity(
    description: string,
    userId?: string,
    ip?: string,
    userAgent?: string,
    metadata?: Record<string, any>,
  ) {
    this.logSecurityEvent({
      type: SecurityEventType.SUSPICIOUS_ACTIVITY,
      userId,
      ip,
      userAgent,
      metadata: { description, ...metadata },
    });
  }

  /**
   * Determine if event is high severity
   */
  private isHighSeverityEvent(type: SecurityEventType): boolean {
    const highSeverityEvents = [
      SecurityEventType.LOGIN_FAILURE,
      SecurityEventType.ACCOUNT_LOCKED,
      SecurityEventType.PERMISSION_DENIED,
      SecurityEventType.RATE_LIMIT_EXCEEDED,
      SecurityEventType.SUSPICIOUS_ACTIVITY,
    ];

    return highSeverityEvents.includes(type);
  }
}
