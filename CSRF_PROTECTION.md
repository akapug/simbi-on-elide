# CSRF Protection Implementation

This document describes the Cross-Site Request Forgery (CSRF) protection implementation in the Simbi modern application.

## Overview

CSRF protection has been implemented using the **Double Submit Cookie pattern** with HMAC signing for enhanced security. This approach works seamlessly with SPAs (Single Page Applications) and JWT authentication.

## Architecture

### Backend Implementation

#### 1. CSRF Service (`/apps/backend/src/common/services/csrf.service.ts`)

The CSRF service implements token generation and validation:

- **Token Generation**: Creates a random value, signs it with HMAC-SHA256, and returns both the token and cookie value
- **Token Validation**: Verifies that the token signature is valid and matches the cookie value
- **Timing-Safe Comparison**: Prevents timing attacks during validation

#### 2. CSRF Guard (`/apps/backend/src/common/guards/csrf.guard.ts`)

A NestJS guard that:

- Automatically protects all state-changing requests (POST, PUT, DELETE, PATCH)
- Allows GET, HEAD, and OPTIONS requests without CSRF validation
- Can be bypassed using the `@SkipCsrf()` decorator for specific endpoints
- Returns a 403 error with `CSRF_VALIDATION_FAILED` error code on validation failure

#### 3. CSRF Controller (`/apps/backend/src/common/controllers/csrf.controller.ts`)

Provides an endpoint to fetch CSRF tokens:

- **GET /api/v1/csrf/token**: Returns a CSRF token and sets a cookie
- Token expires after 1 hour
- This endpoint skips CSRF validation (as clients need to get the initial token)

#### 4. Configuration

In `main.ts`:
- Added `cookie-parser` middleware to parse cookies
- Configured CORS with `credentials: true` to allow cookies

In `app.module.ts`:
- Added `CsrfModule` to imports
- Registered `CsrfGuard` as a global guard

### Frontend Implementation

#### 1. API Service (`/apps/frontend/src/services/api.ts`)

Enhanced axios configuration with CSRF handling:

- **Token Management**: Stores CSRF token and expiry time in memory
- **Request Interceptor**: Automatically adds `X-CSRF-Token` header to state-changing requests
- **Response Interceptor**: Handles CSRF validation failures by fetching a new token and retrying
- **Auto-refresh**: Fetches new token when expired
- **Error Handling**: Provides user-friendly error messages for CSRF failures

#### 2. App Initialization (`/apps/frontend/src/main.ts`)

- Calls `initCsrf()` on app startup to prefetch a CSRF token
- App mounts even if CSRF initialization fails (tokens will be fetched on first request)

## Security Features

### 1. Double Submit Cookie Pattern

- Cookie value stored in `XSRF-TOKEN` cookie (not httpOnly, so JavaScript can read it)
- Full token (randomValue.signature) sent in `X-CSRF-Token` header
- Server validates that the signature matches the cookie value

### 2. HMAC Signing

- Random values are signed with HMAC-SHA256 using a secret key
- Prevents attackers from forging valid tokens even if they can set cookies

### 3. Timing-Safe Comparison

- Uses constant-time string comparison to prevent timing attacks
- Ensures validation time doesn't leak information about token validity

### 4. Integration with JWT

- Works alongside JWT authentication without conflicts
- JWT validates the user's identity
- CSRF validates that the request originated from the legitimate application

## Protected Endpoints

### Automatically Protected

All state-changing endpoints (POST, PUT, DELETE, PATCH) are automatically protected unless explicitly excluded.

### Excluded Endpoints

The following endpoints skip CSRF validation:

1. **Authentication endpoints** (no session exists yet):
   - POST /api/v1/auth/register
   - POST /api/v1/auth/login
   - POST /api/v1/auth/google
   - POST /api/v1/auth/facebook
   - POST /api/v1/auth/refresh

2. **CSRF token endpoint**:
   - GET /api/v1/csrf/token

To exclude other endpoints, use the `@SkipCsrf()` decorator:

```typescript
import { SkipCsrf } from '../../common/guards/csrf.guard';

@Post('webhook')
@SkipCsrf()
async handleWebhook() {
  // This endpoint won't require CSRF validation
}
```

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# CSRF Protection
CSRF_SECRET=your-super-secret-csrf-key-change-in-production
```

If not provided, a random secret is generated on app startup (not recommended for production with multiple instances).

### CORS Configuration

CORS must be configured with `credentials: true` in `main.ts`:

```typescript
app.enableCors({
  origin: configService.get('FRONTEND_URL') || 'http://localhost:5173',
  credentials: true, // Required for cookies
});
```

## Testing

### Test GET Requests (No CSRF Required)

```bash
curl http://localhost:3000/api/v1/users/123
```

Should work without any CSRF token.

### Test POST Requests (CSRF Required)

1. Get a CSRF token:
```bash
curl -X GET http://localhost:3000/api/v1/csrf/token -c cookies.txt
```

2. Extract the token from the response and cookie, then make a request:
```bash
curl -X POST http://localhost:3000/api/v1/users/profile \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <token-from-response>" \
  -H "Authorization: Bearer <jwt-token>" \
  -b cookies.txt \
  -d '{"name": "Test User"}'
```

### Test CSRF Validation Failure

Try making a POST request without a CSRF token:
```bash
curl -X POST http://localhost:3000/api/v1/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt-token>" \
  -d '{"name": "Test User"}'
```

Should return:
```json
{
  "statusCode": 403,
  "message": "Invalid CSRF token",
  "error": "CSRF_VALIDATION_FAILED"
}
```

## Frontend Usage

The CSRF protection is transparent to developers. The axios instance automatically:

1. Fetches a CSRF token on app initialization
2. Includes the token in all state-changing requests
3. Refreshes the token if it expires
4. Retries requests if CSRF validation fails

No manual intervention is needed in most cases.

### Manual Token Refresh

If you need to manually refresh the CSRF token:

```typescript
import { initCsrf } from '@/services/api';

await initCsrf();
```

## Troubleshooting

### "Invalid CSRF token" Error

**Causes:**
1. CSRF token expired (1 hour lifetime)
2. Cookie not being sent (CORS misconfiguration)
3. Token and cookie don't match

**Solutions:**
1. The frontend automatically retries with a fresh token
2. Check that `withCredentials: true` is set in axios config
3. Verify CORS is configured with `credentials: true`
4. Check browser console for cookie-related errors

### CSRF Token Not Being Sent

**Causes:**
1. Browser blocking third-party cookies
2. CORS not configured properly
3. Request not using the configured axios instance

**Solutions:**
1. Ensure frontend and backend are on the same domain or CORS is properly configured
2. Use `import api from '@/services/api'` instead of creating new axios instances
3. Check that `withCredentials: true` is set

### Token Validation Always Fails

**Causes:**
1. CSRF_SECRET changed between token generation and validation
2. Multiple backend instances with different secrets
3. Clock skew causing expiry issues

**Solutions:**
1. Use a consistent CSRF_SECRET across all environments
2. Store CSRF_SECRET in environment variables, not generated randomly
3. Ensure system clocks are synchronized

## Production Considerations

1. **Set CSRF_SECRET**: Always set a strong, random CSRF_SECRET in production
2. **Use HTTPS**: Set `secure: true` for cookies in production (already configured based on NODE_ENV)
3. **SameSite Cookies**: Cookies use `sameSite: 'strict'` for additional protection
4. **Multiple Instances**: Use the same CSRF_SECRET across all backend instances
5. **CDN/Proxy**: Ensure cookies and headers are properly forwarded

## Security Best Practices

1. **Don't disable CSRF**: Only use `@SkipCsrf()` when absolutely necessary
2. **Validate origin**: Consider additional origin validation for sensitive operations
3. **Rate limiting**: Use rate limiting on authentication endpoints
4. **Audit logs**: Log CSRF validation failures for security monitoring
5. **Token rotation**: Tokens expire after 1 hour, forcing rotation

## References

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Double Submit Cookie Pattern](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#double-submit-cookie)
- [NestJS Guards Documentation](https://docs.nestjs.com/guards)
