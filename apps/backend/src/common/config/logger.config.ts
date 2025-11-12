import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { ConfigService } from '@nestjs/config';

/**
 * Winston Logger Configuration
 * Provides structured logging with different transports based on environment
 */
export const createLogger = (configService: ConfigService) => {
  const isProduction = configService.get('NODE_ENV') === 'production';
  const logLevel = configService.get('LOG_LEVEL') || 'info';

  // Custom format for structured logging
  const structuredFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.metadata({
      fillExcept: ['message', 'level', 'timestamp', 'label'],
    }),
    winston.format.json(),
  );

  // Human-readable format for development
  const developmentFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, context, trace }) => {
      const ctx = context ? `[${context}] ` : '';
      const stack = trace ? `\n${trace}` : '';
      return `${timestamp} ${level} ${ctx}${message}${stack}`;
    }),
  );

  const transports: winston.transport[] = [];

  if (isProduction) {
    // Production: JSON structured logs to stdout
    transports.push(
      new winston.transports.Console({
        format: structuredFormat,
      }),
    );

    // Optional: Add file transports for production
    transports.push(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: structuredFormat,
        maxsize: 10485760, // 10MB
        maxFiles: 5,
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: structuredFormat,
        maxsize: 10485760, // 10MB
        maxFiles: 5,
      }),
    );
  } else {
    // Development: Human-readable logs to console
    transports.push(
      new winston.transports.Console({
        format: developmentFormat,
      }),
    );
  }

  return WinstonModule.createLogger({
    level: logLevel,
    transports,
    // Prevent Winston from exiting on error
    exitOnError: false,
  });
};

/**
 * Security event types for audit logging
 */
export enum SecurityEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET_REQUEST = 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET_COMPLETE = 'PASSWORD_RESET_COMPLETE',
  EMAIL_CHANGE = 'EMAIL_CHANGE',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  MFA_ENABLED = 'MFA_ENABLED',
  MFA_DISABLED = 'MFA_DISABLED',
  OAUTH_LOGIN = 'OAUTH_LOGIN',
  API_KEY_CREATED = 'API_KEY_CREATED',
  API_KEY_REVOKED = 'API_KEY_REVOKED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
}

/**
 * Structure for security event logging
 */
export interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}
