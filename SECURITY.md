# Security Hardening - Simbi Modern Application

This document outlines all security measures implemented in the Simbi modern application and best practices for deployment.

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Input Validation & Sanitization](#input-validation--sanitization)
3. [API Security](#api-security)
4. [Data Protection](#data-protection)
5. [Error Handling](#error-handling)
6. [Logging & Monitoring](#logging--monitoring)
7. [Infrastructure Security](#infrastructure-security)
8. [Deployment Checklist](#deployment-checklist)

---

## Authentication & Authorization

### OAuth Email Validation

**Location:** `apps/backend/src/modules/auth/strategies/`

- **Google Strategy** (`google.strategy.ts`)
- **Facebook Strategy** (`facebook.strategy.ts`)

**Security Measures:**
- Validates that email is provided before proceeding with OAuth authentication
- Returns clear error messages when email permission is denied
- Uses optional chaining to safely access nested OAuth profile properties
- Prevents null reference errors that could crash the application

**Code Example:**
```typescript
if (!emails || !emails[0] || !emails[0].value) {
  return done(
    new Error('Email permission is required for authentication'),
    null,
  );
}
```

### JWT Security

**Environment Variables:**
- `JWT_SECRET` - Must be at least 32 characters (enforced by validation)
- `JWT_REFRESH_SECRET` - Must be at least 32 characters
- `JWT_EXPIRES_IN` - Default: 7 days
- `JWT_REFRESH_EXPIRES_IN` - Default: 30 days

**Best Practices:**
- Generate secrets using: `openssl rand -base64 32`
- Rotate secrets regularly
- Use different secrets for development, staging, and production
- Store secrets in environment variable management tools (AWS Secrets Manager, Vault, etc.)

### CSRF Protection

**Location:** `apps/backend/src/common/modules/csrf.module.ts`

- Enabled globally for all state-changing requests (POST, PUT, PATCH, DELETE)
- Uses secure cookie-based tokens
- Validates CSRF tokens on every mutation request

---

## Input Validation & Sanitization

### SQL Injection Prevention

**Location:** `apps/backend/src/modules/services/dto/services.dto.ts`

**Security Measures:**
- Whitelisted sort columns using `@IsIn()` decorator
- Prevents arbitrary SQL column names in ORDER BY clauses
- Validates all query parameters before database operations

**Code Example:**
```typescript
@IsIn(['createdAt', 'updatedAt', 'title', 'simbiPrice', 'usdPrice'])
@IsOptional()
sortBy?: string;
```

### Request Validation

**Global Validation Pipe** (`main.ts`):
```typescript
new ValidationPipe({
  whitelist: true,           // Strip non-whitelisted properties
  forbidNonWhitelisted: true, // Throw error on non-whitelisted properties
  transform: true,            // Auto-transform payloads to DTO types
})
```

---

## API Security

### Rate Limiting

**Configuration:** `apps/backend/src/app.module.ts`

- Default: 100 requests per 60 seconds per IP
- Configurable via environment variables:
  - `RATE_LIMIT_TTL` - Time window in milliseconds
  - `RATE_LIMIT_MAX` - Maximum requests per window

**Recommendations:**
- Lower limits for sensitive endpoints (login: 5/min, password reset: 3/min)
- Higher limits for public read-only endpoints
- Monitor rate limit violations in logs

### CORS Configuration

**Location:** `apps/backend/src/main.ts`

```typescript
app.enableCors({
  origin: configService.get('FRONTEND_URL'),
  credentials: true,
});
```

**Production:**
- Set `FRONTEND_URL` to your production domain
- Never use `*` for origin in production
- Enable `credentials: true` only if needed for cookies/auth

### Security Headers (Helmet)

**Enabled protections:**
- Content Security Policy (CSP)
- X-Frame-Options (clickjacking protection)
- X-Content-Type-Options (MIME sniffing protection)
- Strict-Transport-Security (HTTPS enforcement)
- X-XSS-Protection

---

## Data Protection

### Response DTOs with Sensitive Field Exclusion

**Location:** `apps/backend/src/modules/users/dto/users.dto.ts`

**Excluded from API responses:**
- Passwords (hashed)
- OAuth tokens and refresh tokens
- Phone numbers (except for own profile)
- Full addresses (except for own profile)
- GPS coordinates (latitude/longitude)
- Internal settings and flags
- Device tokens
- Payment method details

**Usage:**
```typescript
// Public user data
export class UserResponseDto {
  @Expose() id: string;
  @Expose() email: string;
  @Exclude() password?: string;  // Never exposed
}

// Private user data (own profile)
export class PrivateUserResponseDto extends UserResponseDto {
  @Expose() phoneNumber?: string;  // Only for own profile
}
```

### Password Security

**Best Practices:**
- Passwords hashed using bcrypt with 10 rounds (configurable via `BCRYPT_ROUNDS`)
- Never store plain-text passwords
- Password reset tokens expire after 1 hour
- Rate limit password reset requests

---

## Error Handling

### Global Exception Filter

**Location:** `apps/backend/src/common/filters/http-exception.filter.ts`

**Security Features:**
- Stack traces hidden in production
- Sensitive fields sanitized from error logs (passwords, tokens, API keys)
- User-friendly error messages in production
- Detailed error messages in development
- All errors logged with request context

**Sanitized fields:**
- password, passwordConfirm, currentPassword, newPassword
- token, accessToken, refreshToken, apiKey, secret
- creditCard, cvv, ssn

---

## Logging & Monitoring

### Structured Logging with Winston

**Location:** `apps/backend/src/common/config/logger.config.ts`

**Features:**
- JSON structured logs in production
- Human-readable logs in development
- Separate error log file
- Log rotation (10MB max, 5 files retained)
- Configurable log levels via `LOG_LEVEL` environment variable

### Request ID Tracking

**Location:** `apps/backend/src/common/middleware/request-id.middleware.ts`

**Features:**
- Unique request ID for every HTTP request
- Request ID included in all logs
- Request ID returned in response headers (`X-Request-ID`)
- Enables end-to-end request tracing

### Security Event Logging

**Location:** `apps/backend/src/common/services/security-logger.service.ts`

**Logged security events:**
- Login successes and failures
- Password changes and resets
- OAuth logins
- Permission denials
- Rate limit violations
- Suspicious activity

**Usage:**
```typescript
// Log successful login
securityLogger.logLoginSuccess(userId, email, ip, userAgent);

// Log failed login
securityLogger.logLoginFailure(email, ip, userAgent, reason);
```

### Health Checks

**Location:** `apps/backend/src/common/controllers/health.controller.ts`

**Endpoints:**
- `GET /health` - Comprehensive health check (all services)
- `GET /health/ping` - Simple liveness check
- `GET /health/database` - PostgreSQL health
- `GET /health/redis` - Redis health
- `GET /health/system` - Memory, CPU, disk usage

**Monitored services:**
- PostgreSQL database connectivity
- Redis cache connectivity
- MeiliSearch search engine (if configured)
- Memory usage (heap and RSS)
- Disk usage (alert at 90% full)

---

## Infrastructure Security

### Environment Variable Validation

**Location:** `apps/backend/src/common/config/env.validation.ts`

**Validated on startup:**
- Required variables: `DATABASE_URL`, `JWT_SECRET`, `REDIS_HOST`, `FRONTEND_URL`
- Secret length requirements (min 32 characters for JWT secrets)
- URI format validation for URLs
- Conditional validation (if OAuth enabled, all OAuth fields required)

**Fail-fast approach:**
- Application refuses to start if critical variables are missing
- Clear error messages indicate which variables are missing
- Prevents runtime errors from misconfiguration

### Database Security

**Best Practices:**
- Use Prisma ORM (parameterized queries prevent SQL injection)
- Enable SSL/TLS for database connections in production
- Use read replicas for scaling
- Regular backups with point-in-time recovery
- Restrict database access by IP whitelist
- Use strong passwords and rotate regularly

### Redis Security

**Best Practices:**
- Always set `REDIS_PASSWORD` in production
- Disable dangerous commands (FLUSHALL, KEYS, etc.)
- Use Redis ACLs to limit permissions
- Enable SSL/TLS for Redis connections
- Regular backups via RDB or AOF

---

## Deployment Checklist

### Pre-Deployment

- [ ] Generate strong secrets for all required environment variables
- [ ] Enable environment variable validation
- [ ] Configure production database with SSL
- [ ] Set up Redis with password and SSL
- [ ] Configure error monitoring (Sentry)
- [ ] Set up structured logging destination (CloudWatch, Datadog, etc.)
- [ ] Enable HTTPS (never HTTP in production)
- [ ] Configure proper CORS origins (no wildcards)
- [ ] Review and adjust rate limits for production traffic
- [ ] Set up database backups and test restoration
- [ ] Configure health check endpoints in load balancer
- [ ] Enable log aggregation and alerting
- [ ] Set up security monitoring and alerts

### Post-Deployment

- [ ] Verify all health checks are passing
- [ ] Test rate limiting is working
- [ ] Verify CSRF protection is enabled
- [ ] Check that error responses don't leak sensitive information
- [ ] Verify request IDs are in logs
- [ ] Test OAuth flows (if enabled)
- [ ] Verify file upload restrictions work
- [ ] Check that API documentation is accessible
- [ ] Run security audit: `npm audit`
- [ ] Perform penetration testing (OWASP ZAP, Burp Suite)

### Ongoing Security

- [ ] Rotate secrets quarterly
- [ ] Review audit logs weekly
- [ ] Update dependencies monthly: `npm update`
- [ ] Monitor security advisories for dependencies
- [ ] Review and update rate limits based on traffic patterns
- [ ] Regular backup tests
- [ ] Incident response plan review
- [ ] Security training for team members

---

## Security Contacts

For security issues or vulnerabilities, please contact:
- Email: security@simbi.com
- Report format: Include details, steps to reproduce, and impact assessment

**Do not disclose security vulnerabilities publicly until they have been addressed.**

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security Best Practices](https://docs.nestjs.com/security/authentication)
- [Node.js Security Checklist](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

---

## Version History

- **v2.0.0** (2025-11-12) - Complete security hardening
  - OAuth email validation
  - SQL injection prevention
  - Environment variable validation
  - Response DTO sanitization
  - Global exception filter
  - Comprehensive health checks
  - Structured logging with request IDs
  - Security event logging
