import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/services/prisma.service';

@Injectable()
export class CommunitiesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.community.findMany({
      include: {
        _count: { select: { members: true } },
      },
      orderBy: { featured: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.community.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, username: true, firstName: true, lastName: true, avatar: true },
            },
          },
        },
      },
    });
  }

  async join(communityId: string, userId: string) {
    return this.prisma.communityUser.create({
      data: { communityId, userId },
    });
  }

  async leave(communityId: string, userId: string) {
    return this.prisma.communityUser.delete({
      where: {
        communityId_userId: { communityId, userId },
      },
    });
  }
}
