import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/services/prisma.service';
import { UpdateUserRoleDto, BanUserDto, ResolveFlagDto, ModerateContentDto, AdminSearchDto } from './dto/admin.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  async getAllUsers(query: AdminSearchDto) {
    const { page = 1, limit = 20, role, includeDeleted, query: searchQuery } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (!includeDeleted) {
      where.deletedAt = null;
    }

    if (searchQuery) {
      where.OR = [
        { email: { contains: searchQuery, mode: 'insensitive' } },
        { username: { contains: searchQuery, mode: 'insensitive' } },
        { firstName: { contains: searchQuery, mode: 'insensitive' } },
        { lastName: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          avatar: true,
          createdAt: true,
          lastSeenAt: true,
          deletedAt: true,
          deactivatedAt: true,
          rating: true,
          trustScore: true,
          emailVerified: true,
          _count: {
            select: {
              services: true,
              sentTalks: true,
              reviews: true,
              flags: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getUserDetails(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            services: true,
            sentTalks: true,
            receivedTalks: true,
            reviews: true,
            receivedReviews: true,
            sentOffers: true,
            receivedOffers: true,
            orders: true,
            sellerOrders: true,
            flags: true,
            followers: true,
            following: true,
          },
        },
        accounts: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  async updateUserRole(userId: string, dto: UpdateUserRoleDto, adminId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.id === adminId) {
      throw new BadRequestException('Cannot modify your own role');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { role: dto.role },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'UPDATE_USER_ROLE',
        entityType: 'User',
        entityId: userId,
        oldValue: { role: user.role },
        newValue: { role: dto.role },
      },
    });

    return updatedUser;
  }

  async banUser(userId: string, dto: BanUserDto, adminId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.id === adminId) {
      throw new BadRequestException('Cannot ban yourself');
    }

    const deactivatedAt = new Date();
    await this.prisma.user.update({
      where: { id: userId },
      data: { deactivatedAt },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'BAN_USER',
        entityType: 'User',
        entityId: userId,
        newValue: { reason: dto.reason, duration: dto.duration, deactivatedAt },
      },
    });

    return { message: 'User banned successfully', deactivatedAt };
  }

  async unbanUser(userId: string, adminId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { deactivatedAt: null },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'UNBAN_USER',
        entityType: 'User',
        entityId: userId,
      },
    });

    return { message: 'User unbanned successfully' };
  }

  // ============================================================================
  // CONTENT MODERATION
  // ============================================================================

  async getAllFlags(query: AdminSearchDto) {
    const { page = 1, limit = 20, includeDeleted } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (!includeDeleted) {
      where.resolved = false;
    }

    const [flags, total] = await Promise.all([
      this.prisma.flag.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          service: {
            select: {
              id: true,
              title: true,
              state: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.flag.count({ where }),
    ]);

    return {
      flags,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async resolveFlag(flagId: string, dto: ResolveFlagDto, adminId: string) {
    const flag = await this.prisma.flag.findUnique({
      where: { id: flagId },
    });

    if (!flag) {
      throw new NotFoundException('Flag not found');
    }

    const updatedFlag = await this.prisma.flag.update({
      where: { id: flagId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: adminId,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'RESOLVE_FLAG',
        entityType: 'Flag',
        entityId: flagId,
        newValue: { action: dto.action, notes: dto.notes },
      },
    });

    return updatedFlag;
  }

  async moderateService(serviceId: string, dto: ModerateContentDto, adminId: string) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    let updateData: any = {};

    switch (dto.action) {
      case 'hide':
        updateData = { state: 'inactive' as const };
        break;
      case 'delete':
        updateData = { state: 'deleted' as const, deletedAt: new Date() };
        break;
      case 'restore':
        updateData = { state: 'active' as const, deletedAt: null };
        break;
    }

    const updatedService = await this.prisma.service.update({
      where: { id: serviceId },
      data: updateData,
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'MODERATE_SERVICE',
        entityType: 'Service',
        entityId: serviceId,
        oldValue: { state: service.state },
        newValue: { state: updateData.state, reason: dto.reason },
      },
    });

    return updatedService;
  }

  async moderateReview(reviewId: string, dto: ModerateContentDto, adminId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    let updateData: any = {};

    switch (dto.action) {
      case 'hide':
        updateData = { status: 'hidden' as const };
        break;
      case 'delete':
        updateData = { status: 'hidden' as const };
        break;
      case 'restore':
        updateData = { status: 'published' as const };
        break;
    }

    const updatedReview = await this.prisma.review.update({
      where: { id: reviewId },
      data: updateData,
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'MODERATE_REVIEW',
        entityType: 'Review',
        entityId: reviewId,
        oldValue: { status: review.status },
        newValue: { status: updateData.status, reason: dto.reason },
      },
    });

    return updatedReview;
  }

  async deleteService(serviceId: string, adminId: string) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    await this.prisma.service.update({
      where: { id: serviceId },
      data: {
        state: 'deleted',
        deletedAt: new Date(),
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'DELETE_SERVICE',
        entityType: 'Service',
        entityId: serviceId,
      },
    });

    return { message: 'Service deleted successfully' };
  }

  // ============================================================================
  // SYSTEM STATS & ANALYTICS
  // ============================================================================

  async getSystemStats() {
    const [
      totalUsers,
      activeUsers,
      totalServices,
      activeServices,
      totalTalks,
      totalOrders,
      totalReviews,
      unresolvedFlags,
      recentUsers,
      usersByRole,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: {
          lastSeenAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
      this.prisma.service.count(),
      this.prisma.service.count({
        where: { state: 'active' },
      }),
      this.prisma.talk.count(),
      this.prisma.order.count(),
      this.prisma.review.count(),
      this.prisma.flag.count({
        where: { resolved: false },
      }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        recent: recentUsers,
        byRole: usersByRole.reduce((acc, { role, _count }) => {
          acc[role] = _count;
          return acc;
        }, {} as Record<string, number>),
      },
      services: {
        total: totalServices,
        active: activeServices,
      },
      talks: {
        total: totalTalks,
      },
      orders: {
        total: totalOrders,
      },
      reviews: {
        total: totalReviews,
      },
      moderation: {
        unresolvedFlags,
      },
    };
  }

  async getRecentActivity(limit: number = 50) {
    const auditLogs = await this.prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        action: true,
        entityType: true,
        entityId: true,
        createdAt: true,
      },
    });

    return auditLogs;
  }

  async getUserGrowth(days: number = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const users = await this.prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      _count: true,
    });

    return users;
  }
}
