import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/services/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(authorId: string, data: any) {
    const review = await this.prisma.review.create({
      data: {
        authorId,
        subjectId: data.subjectId,
        serviceId: data.serviceId,
        talkId: data.talkId,
        rating: data.rating,
        content: data.content,
        status: 'published',
        publishedAt: new Date(),
      },
    });

    // Update user/service rating
    if (data.subjectId) {
      const reviews = await this.prisma.review.findMany({
        where: { subjectId: data.subjectId, status: 'published' },
      });
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await this.prisma.user.update({
        where: { id: data.subjectId },
        data: { rating: avgRating },
      });
    }

    return review;
  }

  async findByUser(userId: string) {
    return this.prisma.review.findMany({
      where: { subjectId: userId, status: 'published' },
      include: {
        author: {
          select: { id: true, username: true, firstName: true, lastName: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
