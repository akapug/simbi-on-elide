import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/services/prisma.service';
import { UpdateProfileDto, UpdateSettingsDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        accounts: true,
        _count: {
          select: {
            services: true,
            followers: true,
            following: true,
            reviews: true,
            receivedReviews: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...result } = user;
    return result;
  }

  async findByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        accounts: true,
        services: {
          where: { state: 'active' },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            services: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...result } = user;
    return result;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
  }

  async updateSettings(userId: string, dto: UpdateSettingsDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        settings: dto,
      },
    });
  }

  async follow(followerId: string, followedId: string) {
    return this.prisma.friendship.create({
      data: {
        followerId,
        followedId,
      },
    });
  }

  async unfollow(followerId: string, followedId: string) {
    return this.prisma.friendship.delete({
      where: {
        followerId_followedId: {
          followerId,
          followedId,
        },
      },
    });
  }

  async getFollowers(userId: string) {
    return this.prisma.friendship.findMany({
      where: { followedId: userId },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            rating: true,
          },
        },
      },
    });
  }

  async getFollowing(userId: string) {
    return this.prisma.friendship.findMany({
      where: { followerId: userId },
      include: {
        followed: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            rating: true,
          },
        },
      },
    });
  }

  async getSuggestedUsers(userId: string) {
    // Get users near the current user or in similar communities
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) return [];

    return this.prisma.user.findMany({
      where: {
        id: { not: userId },
        deletedAt: null,
        deactivatedAt: null,
      },
      take: 20,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        about: true,
        rating: true,
        _count: {
          select: {
            services: true,
            followers: true,
          },
        },
      },
    });
  }

  async getActivity(userId: string, limit = 50) {
    return this.prisma.activityFeed.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}
