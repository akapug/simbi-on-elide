import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/common/services/prisma.service';
import { CreateServiceDto, UpdateServiceDto, SearchServicesDto, FlagServiceDto } from './dto/services.dto';
import { ServiceKind, ServiceState, UserRole } from '@prisma/client';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateServiceDto) {
    return this.prisma.service.create({
      data: {
        userId,
        ...dto,
        state: 'draft',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            rating: true,
          },
        },
        category: true,
      },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }) {
    const { skip = 0, take = 20, where, orderBy } = params;

    const [services, total] = await Promise.all([
      this.prisma.service.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              rating: true,
            },
          },
          category: true,
          _count: {
            select: {
              favorites: true,
              comments: true,
              reviews: true,
            },
          },
        },
      }),
      this.prisma.service.count({ where }),
    ]);

    return {
      services,
      total,
      page: Math.floor(skip / take) + 1,
      pages: Math.ceil(total / take),
    };
  }

  async findById(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            about: true,
            rating: true,
            responseRate: true,
          },
        },
        category: true,
        comments: {
          where: { deletedAt: null, hidden: false },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        reviews: {
          where: { status: 'published' },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            favorites: true,
            comments: true,
            reviews: true,
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Increment view count
    await this.prisma.service.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return service;
  }

  async update(id: string, userId: string, dto: UpdateServiceDto) {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (service.userId !== userId) {
      throw new ForbiddenException('Not authorized to update this service');
    }

    return this.prisma.service.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string, userId: string, userRole?: UserRole) {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Allow service owner, moderators, or admins to delete
    const isOwner = service.userId === userId;
    const isModerator = userRole === 'moderator' || userRole === 'admin';

    if (!isOwner && !isModerator) {
      throw new ForbiddenException('Not authorized to delete this service');
    }

    return this.prisma.service.update({
      where: { id },
      data: {
        state: 'deleted',
        deletedAt: new Date(),
      },
    });
  }

  async publish(id: string, userId: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (service.userId !== userId) {
      throw new ForbiddenException('Not authorized to publish this service');
    }

    return this.prisma.service.update({
      where: { id },
      data: {
        state: 'active',
        publishedAt: new Date(),
      },
    });
  }

  async like(serviceId: string, userId: string) {
    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_serviceId: {
          userId,
          serviceId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    const favorite = await this.prisma.favorite.create({
      data: {
        userId,
        serviceId,
        type: 'like',
      },
    });

    await this.prisma.service.update({
      where: { id: serviceId },
      data: { likeCount: { increment: 1 } },
    });

    return favorite;
  }

  async unlike(serviceId: string, userId: string) {
    await this.prisma.favorite.delete({
      where: {
        userId_serviceId: {
          userId,
          serviceId,
        },
      },
    });

    await this.prisma.service.update({
      where: { id: serviceId },
      data: { likeCount: { decrement: 1 } },
    });

    return { success: true };
  }

  async search(dto: SearchServicesDto) {
    const where: any = {
      state: 'active',
      deletedAt: null,
    };

    if (dto.kind) {
      where.kind = dto.kind;
    }

    if (dto.tradingType) {
      where.tradingType = dto.tradingType;
    }

    if (dto.categoryId) {
      where.categoryId = dto.categoryId;
    }

    if (dto.query) {
      where.OR = [
        { title: { contains: dto.query, mode: 'insensitive' } },
        { description: { contains: dto.query, mode: 'insensitive' } },
        { tags: { has: dto.query } },
      ];
    }

    // Location-based search
    if (dto.latitude && dto.longitude && dto.radius) {
      // Simple box search - for production use PostGIS
      const latDelta = dto.radius / 69; // 1 degree latitude ≈ 69 miles
      const lonDelta = dto.radius / (69 * Math.cos((dto.latitude * Math.PI) / 180));

      where.latitude = {
        gte: dto.latitude - latDelta,
        lte: dto.latitude + latDelta,
      };
      where.longitude = {
        gte: dto.longitude - lonDelta,
        lte: dto.longitude + lonDelta,
      };
    }

    return this.findAll({
      skip: ((dto.page || 1) - 1) * (dto.limit || 20),
      take: dto.limit || 20,
      where,
      orderBy: { [dto.sortBy || 'createdAt']: dto.sortOrder || 'desc' },
    });
  }

  async getMyServices(userId: string) {
    return this.prisma.service.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        _count: {
          select: {
            favorites: true,
            comments: true,
            reviews: true,
          },
        },
      },
    });
  }

  async getFavorites(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId, serviceId: { not: null } },
      include: {
        service: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return favorites.map((f) => f.service);
  }

  async flagService(serviceId: string, userId: string, dto: FlagServiceDto) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Check if user already flagged this service
    const existingFlag = await this.prisma.flag.findFirst({
      where: {
        userId,
        serviceId,
        resolved: false,
      },
    });

    if (existingFlag) {
      return { message: 'You have already flagged this service', flag: existingFlag };
    }

    const flag = await this.prisma.flag.create({
      data: {
        userId,
        serviceId,
        reason: dto.reason,
        description: dto.description,
      },
    });

    return { message: 'Service flagged for review', flag };
  }
}
