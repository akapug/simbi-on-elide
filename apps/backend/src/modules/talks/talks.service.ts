import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '@/common/services/prisma.service';
import { CreateTalkDto, SendMessageDto, CreateOfferDto } from './dto/talks.dto';
import { TalksGateway } from './talks.gateway';

@Injectable()
export class TalksService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => TalksGateway))
    private talksGateway: TalksGateway,
  ) {}

  async create(userId: string, dto: CreateTalkDto) {
    return this.prisma.talk.create({
      data: {
        senderId: userId,
        receiverId: dto.receiverId,
        serviceId: dto.serviceId,
        subject: dto.subject,
        messages: dto.initialMessage ? {
          create: {
            userId,
            content: dto.initialMessage,
          },
        } : undefined,
      },
      include: {
        sender: { select: { id: true, username: true, firstName: true, lastName: true, avatar: true } },
        receiver: { select: { id: true, username: true, firstName: true, lastName: true, avatar: true } },
        service: true,
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
  }

  async getUserTalks(userId: string) {
    return this.prisma.talk.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
        AND: [
          {
            OR: [
              { senderId: userId, senderArchived: false },
              { receiverId: userId, receiverArchived: false },
            ],
          },
        ],
      },
      include: {
        sender: { select: { id: true, username: true, firstName: true, lastName: true, avatar: true } },
        receiver: { select: { id: true, username: true, firstName: true, lastName: true, avatar: true } },
        service: { select: { id: true, title: true, kind: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getTalkById(id: string, userId: string) {
    const talk = await this.prisma.talk.findUnique({
      where: { id },
      include: {
        sender: { select: { id: true, username: true, firstName: true, lastName: true, avatar: true, rating: true } },
        receiver: { select: { id: true, username: true, firstName: true, lastName: true, avatar: true, rating: true } },
        service: true,
        messages: { orderBy: { createdAt: 'asc' }, include: { user: { select: { id: true, username: true, avatar: true } } } },
        offers: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!talk || (talk.senderId !== userId && talk.receiverId !== userId)) {
      throw new ForbiddenException('Access denied');
    }

    // Mark as read
    if (talk.senderId === userId) {
      await this.prisma.talk.update({ where: { id }, data: { senderRead: true } });
    } else {
      await this.prisma.talk.update({ where: { id }, data: { receiverRead: true } });
    }

    return talk;
  }

  async sendMessage(talkId: string, userId: string, dto: SendMessageDto) {
    const talk = await this.prisma.talk.findUnique({ where: { id: talkId } });
    if (!talk || (talk.senderId !== userId && talk.receiverId !== userId)) {
      throw new ForbiddenException('Access denied');
    }

    const message = await this.prisma.message.create({
      data: {
        talkId,
        userId,
        content: dto.content,
        attachments: dto.attachments || [],
      },
      include: { user: { select: { id: true, username: true, avatar: true } } },
    });

    await this.prisma.talk.update({
      where: { id: talkId },
      data: {
        updatedAt: new Date(),
        senderRead: talk.senderId === userId,
        receiverRead: talk.receiverId === userId,
      },
    });

    return message;
  }

  async createOffer(talkId: string, userId: string, dto: CreateOfferDto) {
    const talk = await this.prisma.talk.findUnique({ where: { id: talkId } });
    if (!talk || (talk.senderId !== userId && talk.receiverId !== userId)) {
      throw new ForbiddenException('Access denied');
    }

    const receiverId = talk.senderId === userId ? talk.receiverId : talk.senderId;

    const offer = await this.prisma.offer.create({
      data: {
        talkId,
        senderId: userId,
        receiverId,
        ...dto,
      },
      include: {
        sender: { select: { id: true, username: true, avatar: true } },
        receiver: { select: { id: true, username: true, avatar: true } },
      },
    });

    // Broadcast new offer via WebSocket
    if (this.talksGateway) {
      this.talksGateway.broadcastToConversation(talkId, 'offer-created', {
        offerId: offer.id,
        conversationId: talkId,
        offer,
        createdAt: offer.createdAt,
      });

      // Notify receiver specifically
      this.talksGateway.sendToUser(receiverId, 'new-offer', {
        offerId: offer.id,
        conversationId: talkId,
        offer,
      });
    }

    return offer;
  }

  async acceptOffer(offerId: string, userId: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        sender: { select: { id: true, username: true } },
        receiver: { select: { id: true, username: true } },
      },
    });

    if (!offer || offer.receiverId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const updatedOffer = await this.prisma.offer.update({
      where: { id: offerId },
      data: { status: 'accepted', acceptedAt: new Date() },
      include: {
        sender: { select: { id: true, username: true } },
        receiver: { select: { id: true, username: true } },
      },
    });

    // Broadcast offer update via WebSocket
    if (this.talksGateway) {
      this.talksGateway.broadcastToConversation(offer.talkId, 'offer-update', {
        offerId: updatedOffer.id,
        conversationId: offer.talkId,
        status: 'accepted',
        offer: updatedOffer,
        updatedAt: new Date(),
      });

      // Notify sender specifically
      this.talksGateway.sendToUser(offer.senderId, 'offer-accepted', {
        offerId: updatedOffer.id,
        conversationId: offer.talkId,
        offer: updatedOffer,
      });
    }

    return updatedOffer;
  }

  async archiveTalk(talkId: string, userId: string) {
    const talk = await this.prisma.talk.findUnique({ where: { id: talkId } });
    if (!talk || (talk.senderId !== userId && talk.receiverId !== userId)) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.talk.update({
      where: { id: talkId },
      data: {
        senderArchived: talk.senderId === userId ? true : talk.senderArchived,
        receiverArchived: talk.receiverId === userId ? true : talk.receiverArchived,
      },
    });
  }
}
