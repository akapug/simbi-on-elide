# RBAC Quick Reference Guide

## Role Capabilities Matrix

| Capability | user | member | moderator | admin |
|-----------|------|--------|-----------|-------|
| View public content | ✅ | ✅ | ✅ | ✅ |
| Manage own profile | ✅ | ✅ | ✅ | ✅ |
| Flag content | ✅ | ✅ | ✅ | ✅ |
| Create services | ❌ | ✅ | ✅ | ✅ |
| Write reviews | ❌ | ✅ | ✅ | ✅ |
| Delete own services | ❌ | ✅ | ✅ | ✅ |
| View flags | ❌ | ❌ | ✅ | ✅ |
| Moderate content | ❌ | ❌ | ✅ | ✅ |
| Delete any content | ❌ | ❌ | ❌ | ✅ |
| User management | ❌ | ❌ | ❌ | ✅ |
| System analytics | ❌ | ❌ | ❌ | ✅ |

## Protected Endpoints Quick List

### Admin Only
```
GET    /admin/users              # List all users
PUT    /admin/users/:id/role     # Update user role
POST   /admin/users/:id/ban      # Ban user
POST   /admin/users/:id/unban    # Unban user
DELETE /admin/services/:id       # Delete any service
GET    /admin/stats              # System statistics
GET    /admin/activity           # Admin activity log
GET    /admin/stats/growth       # User growth stats
```

### Admin or Moderator
```
GET    /admin/users/:id          # Get user details
GET    /admin/flags              # List all flags
POST   /admin/flags/:id/resolve  # Resolve flag
POST   /admin/services/:id/moderate  # Moderate service
POST   /admin/reviews/:id/moderate   # Moderate review
```

### Member+ (Member, Moderator, or Admin)
```
POST   /services                 # Create service
POST   /reviews                  # Create review
```

### Authenticated (All Roles)
```
POST   /services/:id/flag        # Flag service
PUT    /users/profile            # Update own profile
DELETE /services/:id             # Delete own service (owner check)
```

## Code Snippets

### Basic Role Protection
```typescript
@Get('endpoint')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
@ApiBearerAuth()
async adminOnly() { }
```

### Multiple Role Protection
```typescript
@Post('endpoint')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('member', 'moderator', 'admin')
@ApiBearerAuth()
async memberOrHigher() { }
```

### Service-Level Check
```typescript
const isOwner = resource.userId === userId;
const isModerator = userRole === 'moderator' || userRole === 'admin';

if (!isOwner && !isModerator) {
  throw new ForbiddenException('Not authorized');
}
```

## Testing Quick Commands

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed admin user
npx prisma db seed

# Test compilation
npm run build

# Start dev server
npm run start:dev
```

## Common Error Responses

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden (Role Check Failed)
```json
{
  "statusCode": 403,
  "message": "Access denied. Required role: admin. Your role: user"
}
```

### 403 Forbidden (Owner Check Failed)
```json
{
  "statusCode": 403,
  "message": "Not authorized to delete this service"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "User not found"
}
```

## JWT Token Structure

```typescript
{
  sub: "user-id-uuid",
  email: "user@example.com",
  iat: 1234567890,
  exp: 1234567890
}
```

The JWT strategy loads the full user including role:
```typescript
{
  id: "user-id-uuid",
  email: "user@example.com",
  username: "johndoe",
  firstName: "John",
  lastName: "Doe",
  role: "member",  // ← Used by RolesGuard
  avatar: "https://..."
}
```

## Swagger Documentation

All protected endpoints are documented with:
- Required role(s) in summary
- `@ApiBearerAuth()` decorator
- 403 response documentation
- Clear operation descriptions

Example in Swagger UI:
```
🔒 POST /admin/users/:id/ban
Summary: Ban user (Admin only)
Responses:
  200 - User banned successfully
  403 - Access denied. Required role: admin
  404 - User not found
```

## Database Schema

### User Model
```prisma
model User {
  role UserRole @default(user)
  // ... other fields
}

enum UserRole {
  user
  member
  moderator
  admin
}
```

### Audit Log Model
```prisma
model AuditLog {
  id         String   @id @default(uuid())
  userId     String?
  action     String
  entityType String
  entityId   String
  oldValue   Json?
  newValue   Json?
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())
}
```

### Flag Model
```prisma
model Flag {
  id          String   @id @default(uuid())
  userId      String
  serviceId   String?
  reason      String
  description String?
  resolved    Boolean  @default(false)
  resolvedAt  DateTime?
  resolvedBy  String?
  createdAt   DateTime @default(now())
}
```

## Environment Variables

No additional environment variables required. RBAC uses existing:
- `JWT_SECRET` - For token verification
- `JWT_REFRESH_SECRET` - For refresh tokens
- `DATABASE_URL` - Prisma connection

## Role Transitions

### Upgrading User to Member
```typescript
await prisma.user.update({
  where: { id: userId },
  data: { role: 'member' }
});
```

### Checking Role in Service
```typescript
if (user.role === 'admin' || user.role === 'moderator') {
  // Allow privileged action
}
```

### Role Hierarchy Check
```typescript
const roleHierarchy = {
  user: 0,
  member: 1,
  moderator: 2,
  admin: 3
};

if (roleHierarchy[user.role] >= roleHierarchy['member']) {
  // User is member or higher
}
```

## Files Reference

| File | Purpose |
|------|---------|
| `/common/guards/roles.guard.ts` | Role enforcement guard |
| `/common/decorators/roles.decorator.ts` | @Roles() decorator |
| `/common/decorators/get-user.decorator.ts` | @GetUser() helper |
| `/modules/admin/admin.controller.ts` | Admin endpoints |
| `/modules/admin/admin.service.ts` | Admin business logic |
| `/modules/admin/dto/admin.dto.ts` | Admin DTOs |
| `/modules/auth/strategies/jwt.strategy.ts` | JWT validation + user loading |

## Troubleshooting

### "Access denied" when it should work
1. Check JWT token is valid and not expired
2. Verify user role in database matches expected
3. Confirm @Roles() decorator includes user's role
4. Check both AuthGuard and RolesGuard are applied

### "User not authenticated"
1. Verify Authorization header: `Bearer <token>`
2. Check JWT_SECRET matches
3. Confirm user exists in database
4. Verify AuthGuard('jwt') is applied before RolesGuard

### Role not being checked
1. Verify @Roles() decorator is present
2. Confirm RolesGuard is in @UseGuards()
3. Check decorator order: AuthGuard first, then RolesGuard
4. Verify ROLES_KEY matches in guard and decorator

### Decorator not found errors
1. Run `npx prisma generate` to generate UserRole enum
2. Check tsconfig paths for @ alias
3. Verify imports use correct paths
4. Restart TypeScript server in IDE
