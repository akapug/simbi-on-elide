import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import {
  UpdateUserRoleDto,
  BanUserDto,
  ResolveFlagDto,
  ModerateContentDto,
  AdminSearchDto
} from './dto/admin.dto';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

@ApiTags('admin')
@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ============================================================================
  // USER MANAGEMENT - Admin Only
  // ============================================================================

  @Get('users')
  @Roles('admin')
  @ApiOperation({
    summary: 'Get all users (Admin only)',
    description: 'Retrieve a paginated list of all users with filtering options'
  })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Access denied. Required role: admin' })
  async getAllUsers(@Query() query: AdminSearchDto) {
    return this.adminService.getAllUsers(query);
  }

  @Get('users/:id')
  @Roles('admin', 'moderator')
  @ApiOperation({
    summary: 'Get user details (Admin/Moderator)',
    description: 'Get detailed information about a specific user including stats and account info'
  })
  @ApiResponse({ status: 200, description: 'User details retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Access denied. Required role: admin or moderator' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserDetails(@Param('id') id: string) {
    return this.adminService.getUserDetails(id);
  }

  @Put('users/:id/role')
  @Roles('admin')
  @ApiOperation({
    summary: 'Update user role (Admin only)',
    description: 'Change a user\'s role. Admins cannot modify their own role'
  })
  @ApiResponse({ status: 200, description: 'User role updated successfully' })
  @ApiResponse({ status: 403, description: 'Access denied. Required role: admin' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @Req() req: any,
  ) {
    return this.adminService.updateUserRole(id, dto, req.user.id);
  }

  @Post('users/:id/ban')
  @Roles('admin')
  @ApiOperation({
    summary: 'Ban user (Admin only)',
    description: 'Deactivate a user account. Admins cannot ban themselves'
  })
  @ApiResponse({ status: 200, description: 'User banned successfully' })
  @ApiResponse({ status: 403, description: 'Access denied. Required role: admin' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async banUser(
    @Param('id') id: string,
    @Body() dto: BanUserDto,
    @Req() req: any,
  ) {
    return this.adminService.banUser(id, dto, req.user.id);
  }

  @Post('users/:id/unban')
  @Roles('admin')
  @ApiOperation({
    summary: 'Unban user (Admin only)',
    description: 'Reactivate a banned user account'
  })
  @ApiResponse({ status: 200, description: 'User unbanned successfully' })
  @ApiResponse({ status: 403, description: 'Access denied. Required role: admin' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async unbanUser(@Param('id') id: string, @Req() req: any) {
    return this.adminService.unbanUser(id, req.user.id);
  }

  // ============================================================================
  // CONTENT MODERATION - Admin & Moderator
  // ============================================================================

  @Get('flags')
  @Roles('admin', 'moderator')
  @ApiOperation({
    summary: 'Get all content flags (Admin/Moderator)',
    description: 'Retrieve all flagged content for review'
  })
  @ApiResponse({ status: 200, description: 'Flags retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Access denied. Required role: admin or moderator' })
  async getAllFlags(@Query() query: AdminSearchDto) {
    return this.adminService.getAllFlags(query);
  }

  @Post('flags/:id/resolve')
  @Roles('admin', 'moderator')
  @ApiOperation({
    summary: 'Resolve content flag (Admin/Moderator)',
    description: 'Mark a flag as resolved with notes on action taken'
  })
  @ApiResponse({ status: 200, description: 'Flag resolved successfully' })
  @ApiResponse({ status: 403, description: 'Access denied. Required role: admin or moderator' })
  @ApiResponse({ status: 404, description: 'Flag not found' })
  async resolveFlag(
    @Param('id') id: string,
    @Body() dto: ResolveFlagDto,
    @Req() req: any,
  ) {
    return this.adminService.resolveFlag(id, dto, req.user.id);
  }

  @Post('services/:id/moderate')
  @Roles('admin', 'moderator')
  @ApiOperation({
    summary: 'Moderate service (Admin/Moderator)',
    description: 'Hide, delete, or restore a service listing'
  })
  @ApiResponse({ status: 200, description: 'Service moderated successfully' })
  @ApiResponse({ status: 403, description: 'Access denied. Required role: admin or moderator' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async moderateService(
    @Param('id') id: string,
    @Body() dto: ModerateContentDto,
    @Req() req: any,
  ) {
    return this.adminService.moderateService(id, dto, req.user.id);
  }

  @Post('reviews/:id/moderate')
  @Roles('admin', 'moderator')
  @ApiOperation({
    summary: 'Moderate review (Admin/Moderator)',
    description: 'Hide, delete, or restore a review'
  })
  @ApiResponse({ status: 200, description: 'Review moderated successfully' })
  @ApiResponse({ status: 403, description: 'Access denied. Required role: admin or moderator' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async moderateReview(
    @Param('id') id: string,
    @Body() dto: ModerateContentDto,
    @Req() req: any,
  ) {
    return this.adminService.moderateReview(id, dto, req.user.id);
  }

  @Delete('services/:id')
  @Roles('admin')
  @ApiOperation({
    summary: 'Delete service (Admin only)',
    description: 'Permanently delete any service listing'
  })
  @ApiResponse({ status: 200, description: 'Service deleted successfully' })
  @ApiResponse({ status: 403, description: 'Access denied. Required role: admin' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async deleteService(@Param('id') id: string, @Req() req: any) {
    return this.adminService.deleteService(id, req.user.id);
  }

  // ============================================================================
  // SYSTEM STATS & ANALYTICS - Admin Only
  // ============================================================================

  @Get('stats')
  @Roles('admin')
  @ApiOperation({
    summary: 'Get system statistics (Admin only)',
    description: 'Retrieve comprehensive platform statistics and metrics'
  })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Access denied. Required role: admin' })
  async getSystemStats() {
    return this.adminService.getSystemStats();
  }

  @Get('activity')
  @Roles('admin')
  @ApiOperation({
    summary: 'Get recent admin activity (Admin only)',
    description: 'Retrieve recent administrative actions from audit log'
  })
  @ApiResponse({ status: 200, description: 'Activity log retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Access denied. Required role: admin' })
  async getRecentActivity(@Query('limit') limit?: number) {
    return this.adminService.getRecentActivity(limit ? parseInt(limit.toString()) : 50);
  }

  @Get('stats/growth')
  @Roles('admin')
  @ApiOperation({
    summary: 'Get user growth statistics (Admin only)',
    description: 'Retrieve user registration trends over time'
  })
  @ApiResponse({ status: 200, description: 'Growth statistics retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Access denied. Required role: admin' })
  async getUserGrowth(@Query('days') days?: number) {
    return this.adminService.getUserGrowth(days ? parseInt(days.toString()) : 30);
  }
}
