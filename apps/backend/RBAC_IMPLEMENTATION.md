# Role-Based Access Control (RBAC) Implementation

## Overview

This document describes the Role-Based Access Control (RBAC) system implemented for the Simbi modern application. The system enforces different permission levels across four user roles: `user`, `member`, `moderator`, and `admin`.

## User Roles

### Role Hierarchy

1. **user** - Basic access (new accounts)
   - View public content
   - Create account, manage own profile
   - Browse services and users
   - Cannot create services or reviews

2. **member** - Verified users with full features
   - All `user` permissions
   - Create and manage services
   - Write reviews and participate in talks
   - Like/favorite services
   - Follow other users

3. **moderator** - Content moderation
   - All `member` permissions
   - View and resolve content flags
   - Hide/restore services and reviews
   - View user details
   - Moderate any content

4. **admin** - Full platform control
   - All `moderator` permissions
   - Full user management (update roles, ban/unban)
   - Delete any content
   - View system statistics and analytics
   - Access audit logs

## Implementation Components

### 1. Core RBAC Files

#### RolesGuard (`/common/guards/roles.guard.ts`)
- Custom NestJS guard that checks user roles against required roles
- Works in conjunction with `AuthGuard('jwt')`
- Uses reflection to read `@Roles()` decorator metadata
- Throws `ForbiddenException` with detailed error message when access is denied

#### @Roles Decorator (`/common/decorators/roles.decorator.ts`)
- Custom decorator to specify required roles for endpoints
- Supports multiple roles: `@Roles('member', 'moderator', 'admin')`
- Works with RolesGuard to enforce permissions

#### @GetUser Decorator (`/common/decorators/get-user.decorator.ts`)
- Helper decorator to extract user from request
- Supports extracting specific user properties: `@GetUser('id')`

### 2. Admin Module

Complete administrative interface at `/admin/*` endpoints:

#### User Management (`/admin/users/*`)
- `GET /admin/users` - List all users with search/filter (Admin only)
- `GET /admin/users/:id` - Get user details (Admin/Moderator)
- `PUT /admin/users/:id/role` - Update user role (Admin only)
- `POST /admin/users/:id/ban` - Ban user account (Admin only)
- `POST /admin/users/:id/unban` - Unban user account (Admin only)

#### Content Moderation (`/admin/flags/*`, `/admin/services/*`, `/admin/reviews/*`)
- `GET /admin/flags` - List all flags (Admin/Moderator)
- `POST /admin/flags/:id/resolve` - Resolve flag (Admin/Moderator)
- `POST /admin/services/:id/moderate` - Hide/restore service (Admin/Moderator)
- `POST /admin/reviews/:id/moderate` - Hide/restore review (Admin/Moderator)
- `DELETE /admin/services/:id` - Delete service (Admin only)

#### System Analytics (`/admin/stats/*`)
- `GET /admin/stats` - Platform statistics (Admin only)
- `GET /admin/activity` - Recent admin actions (Admin only)
- `GET /admin/stats/growth` - User growth trends (Admin only)

### 3. Protected Endpoints

#### Services Controller (`/services/*`)
- `POST /services` - Create service (Member+ only)
- `DELETE /services/:id` - Delete service (Owner/Moderator/Admin)
- `POST /services/:id/flag` - Flag service for review (Authenticated users)

#### Reviews Controller (`/reviews/*`)
- `POST /reviews` - Create review (Member+ only)

#### Content Flagging
Users can flag inappropriate content:
- Services: `POST /services/:id/flag`
- Prevents duplicate flags from same user
- Creates entry in moderation queue

### 4. Service-Level Role Checks

#### Services Service
- **delete()** - Enhanced to allow moderators/admins to delete any service, not just owners
- **flagService()** - Allows any authenticated user to flag content

## Usage Examples

### Protecting an Endpoint

```typescript
@Post('create')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('member', 'moderator', 'admin')
@ApiBearerAuth()
@ApiOperation({ summary: 'Create resource (Member+ only)' })
@ApiResponse({ status: 403, description: 'Access denied. Required role: member, moderator, or admin' })
async create(@Req() req: any, @Body() dto: CreateDto) {
  return this.service.create(req.user.id, dto);
}
```

### Service-Level Role Check

```typescript
async delete(id: string, userId: string, userRole?: UserRole) {
  const resource = await this.prisma.resource.findUnique({ where: { id } });

  if (!resource) {
    throw new NotFoundException('Resource not found');
  }

  // Allow owner, moderators, or admins to delete
  const isOwner = resource.userId === userId;
  const isModerator = userRole === 'moderator' || userRole === 'admin';

  if (!isOwner && !isModerator) {
    throw new ForbiddenException('Not authorized to delete this resource');
  }

  // Proceed with deletion
}
```

## Swagger Documentation

All protected endpoints include:
- `@ApiBearerAuth()` - Indicates JWT authentication required
- `@ApiOperation()` - Describes endpoint with role requirements
- `@ApiResponse({ status: 403 })` - Documents access denied scenarios

Example:
```typescript
@ApiOperation({
  summary: 'Update user role (Admin only)',
  description: 'Change a user\'s role. Admins cannot modify their own role'
})
@ApiResponse({ status: 200, description: 'User role updated successfully' })
@ApiResponse({ status: 403, description: 'Access denied. Required role: admin' })
```

## Audit Logging

All administrative actions are logged to the `audit_logs` table:
- User role changes
- User bans/unbans
- Content moderation actions
- Flag resolutions
- Service deletions

Example audit log entry:
```typescript
await this.prisma.auditLog.create({
  data: {
    userId: adminId,
    action: 'UPDATE_USER_ROLE',
    entityType: 'User',
    entityId: userId,
    oldValue: { role: 'user' },
    newValue: { role: 'member' },
  },
});
```

## Error Messages

The RBAC system provides clear error messages:

### ForbiddenException Examples
- "Access denied. Required role: admin or moderator. Your role: user"
- "Not authorized to delete this service"
- "Cannot modify your own role"
- "Cannot ban yourself"

### NotFoundException Examples
- "User not found"
- "Service not found"
- "Flag not found"

## Security Considerations

1. **Self-Protection**: Admins cannot ban themselves or modify their own role
2. **Owner Protection**: Resource owners can always manage their own content
3. **Graduated Access**: Permissions build on each other (moderator ⊃ member ⊃ user)
4. **Audit Trail**: All administrative actions are logged
5. **Duplicate Prevention**: Users cannot flag the same content multiple times

## Role Upgrade Path

New users start as `user` and can be upgraded:

```
user → member → moderator → admin
```

Typical upgrade criteria:
- **user → member**: Email verification, profile completion, trusted status
- **member → moderator**: Community nomination, admin approval
- **moderator → admin**: Team decision, proven moderation track record

## Testing RBAC

To test role-based access:

1. Create users with different roles
2. Obtain JWT tokens for each user
3. Attempt to access protected endpoints
4. Verify appropriate access granted/denied
5. Check audit logs for administrative actions

### Test Scenarios

- ✅ Basic user can view but not create services
- ✅ Member can create services and reviews
- ✅ Moderator can view flags and moderate content
- ✅ Admin can manage users and view analytics
- ✅ Moderator cannot change user roles (admin only)
- ✅ User cannot delete others' services
- ✅ Admin cannot modify their own role

## Future Enhancements

Potential RBAC improvements:

1. **Fine-Grained Permissions**: Break roles into specific permissions
2. **Role Expiry**: Time-limited moderator/admin access
3. **Community Moderators**: Per-community moderation roles
4. **Rate Limiting by Role**: Different rate limits per role
5. **Feature Flags by Role**: Beta features for members+
6. **Ban Appeals**: Workflow for users to appeal bans

## Files Modified/Created

### Created
- `/common/guards/roles.guard.ts`
- `/common/decorators/roles.decorator.ts`
- `/common/decorators/get-user.decorator.ts`
- `/modules/admin/admin.module.ts`
- `/modules/admin/admin.controller.ts`
- `/modules/admin/admin.service.ts`
- `/modules/admin/dto/admin.dto.ts`

### Modified
- `/app.module.ts` - Added AdminModule
- `/modules/services/services.controller.ts` - Added role guards and flag endpoint
- `/modules/services/services.service.ts` - Enhanced delete with role check, added flagService
- `/modules/services/dto/services.dto.ts` - Added FlagServiceDto
- `/modules/reviews/reviews.controller.ts` - Added role guards

## API Endpoints Summary

### Public Endpoints
- Authentication, registration, password reset
- View services, users, reviews (read-only)

### Authenticated Endpoints (all roles)
- Manage own profile
- View conversations
- Flag content

### Member+ Endpoints
- Create/edit/delete own services
- Write reviews
- Create offers

### Moderator+ Endpoints
- View all flags
- Resolve flags
- Moderate services and reviews
- View user details

### Admin-Only Endpoints
- User management (roles, bans)
- Delete any content
- System analytics
- Audit logs

## Conclusion

This RBAC implementation provides a robust, scalable permission system that:
- Protects sensitive operations
- Enables community moderation
- Supports platform growth
- Maintains audit trails
- Provides clear error messages
- Documents requirements in Swagger
