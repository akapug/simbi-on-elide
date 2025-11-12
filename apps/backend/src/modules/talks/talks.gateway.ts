import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/common/services/prisma.service';
import { TalksService } from './talks.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/',
})
export class TalksGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TalksGateway.name);
  private activeConnections = new Map<string, Set<string>>(); // userId -> Set of socketIds

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prismaService: PrismaService,
    private talksService: TalksService,
  ) {}

  /**
   * Handle new WebSocket connections with JWT authentication
   */
  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake auth
      const token = client.handshake.auth?.token;

      if (!token) {
        this.logger.warn(`Connection rejected: No token provided`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.verifyToken(token);
      if (!payload) {
        this.logger.warn(`Connection rejected: Invalid token`);
        client.disconnect();
        return;
      }

      // Fetch user from database
      const user = await this.prismaService.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      });

      if (!user) {
        this.logger.warn(`Connection rejected: User not found`);
        client.disconnect();
        return;
      }

      // Attach user to socket
      client.userId = user.id;
      client.user = user;

      // Track active connection
      if (!this.activeConnections.has(user.id)) {
        this.activeConnections.set(user.id, new Set());
      }
      this.activeConnections.get(user.id)!.add(client.id);

      // Update user status to online
      await this.prismaService.user.update({
        where: { id: user.id },
        data: { lastSeenAt: new Date() },
      });

      this.logger.log(`Client connected: ${client.id} (User: ${user.username})`);

      // Notify client of successful connection
      client.emit('connected', {
        message: 'Successfully connected to WebSocket',
        userId: user.id,
      });
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   */
  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      // Remove from active connections
      const userSockets = this.activeConnections.get(client.userId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.activeConnections.delete(client.userId);

          // Update user status to offline
          await this.prismaService.user.update({
            where: { id: client.userId },
            data: { lastSeenAt: new Date() },
          });
        }
      }

      this.logger.log(`Client disconnected: ${client.id} (User: ${client.userId})`);
    } else {
      this.logger.log(`Client disconnected: ${client.id} (Unauthenticated)`);
    }
  }

  /**
   * User joins a conversation room
   */
  @SubscribeMessage('join-conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    try {
      const { conversationId } = data;

      if (!conversationId) {
        throw new WsException('Conversation ID is required');
      }

      // Verify user has access to this conversation
      const talk = await this.prismaService.talk.findUnique({
        where: { id: conversationId },
      });

      if (!talk) {
        throw new WsException('Conversation not found');
      }

      if (talk.senderId !== client.userId && talk.receiverId !== client.userId) {
        throw new WsException('Access denied to this conversation');
      }

      // Join the room
      client.join(`conversation:${conversationId}`);

      this.logger.log(`User ${client.userId} joined conversation: ${conversationId}`);

      // Notify other users in the conversation that someone joined
      client.to(`conversation:${conversationId}`).emit('user-joined', {
        userId: client.userId,
        username: client.user?.username,
        conversationId,
      });

      // Send confirmation to client
      return {
        success: true,
        message: 'Joined conversation successfully',
        conversationId,
      };
    } catch (error) {
      this.logger.error(`Error joining conversation: ${error.message}`);
      throw new WsException(error.message || 'Failed to join conversation');
    }
  }

  /**
   * User leaves a conversation room
   */
  @SubscribeMessage('leave-conversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    try {
      const { conversationId } = data;

      if (!conversationId) {
        throw new WsException('Conversation ID is required');
      }

      // Leave the room
      client.leave(`conversation:${conversationId}`);

      this.logger.log(`User ${client.userId} left conversation: ${conversationId}`);

      // Notify other users
      client.to(`conversation:${conversationId}`).emit('user-left', {
        userId: client.userId,
        username: client.user?.username,
        conversationId,
      });

      return {
        success: true,
        message: 'Left conversation successfully',
        conversationId,
      };
    } catch (error) {
      this.logger.error(`Error leaving conversation: ${error.message}`);
      throw new WsException(error.message || 'Failed to leave conversation');
    }
  }

  /**
   * Send a real-time message
   */
  @SubscribeMessage('message')
  async handleMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; content: string; attachments?: string[] },
  ) {
    try {
      const { conversationId, content, attachments } = data;

      if (!conversationId || !content) {
        throw new WsException('Conversation ID and content are required');
      }

      // Save message to database
      const message = await this.talksService.sendMessage(
        conversationId,
        client.userId!,
        { content, attachments },
      );

      // Broadcast to all users in the conversation (including sender for confirmation)
      this.server.to(`conversation:${conversationId}`).emit('message', {
        id: message.id,
        conversationId,
        userId: message.userId,
        user: message.user,
        content: message.content,
        attachments: message.attachments,
        createdAt: message.createdAt,
      });

      // Also emit to individual users (for notifications if not in room)
      const talk = await this.prismaService.talk.findUnique({
        where: { id: conversationId },
      });

      if (talk) {
        const otherUserId = talk.senderId === client.userId ? talk.receiverId : talk.senderId;
        this.emitToUser(otherUserId, 'new-message', {
          conversationId,
          message: {
            id: message.id,
            content: message.content,
            user: message.user,
            createdAt: message.createdAt,
          },
        });
      }

      this.logger.log(`Message sent in conversation ${conversationId} by user ${client.userId}`);

      return {
        success: true,
        message: message,
      };
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`);
      throw new WsException(error.message || 'Failed to send message');
    }
  }

  /**
   * User is typing indicator
   */
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; isTyping: boolean },
  ) {
    try {
      const { conversationId, isTyping } = data;

      if (!conversationId) {
        throw new WsException('Conversation ID is required');
      }

      // Verify access
      const talk = await this.prismaService.talk.findUnique({
        where: { id: conversationId },
      });

      if (!talk || (talk.senderId !== client.userId && talk.receiverId !== client.userId)) {
        throw new WsException('Access denied');
      }

      // Broadcast typing status to others in the conversation (not to sender)
      client.to(`conversation:${conversationId}`).emit('typing', {
        userId: client.userId,
        username: client.user?.username,
        conversationId,
        isTyping,
      });

      return {
        success: true,
      };
    } catch (error) {
      this.logger.error(`Error handling typing: ${error.message}`);
      throw new WsException(error.message || 'Failed to handle typing');
    }
  }

  /**
   * Mark messages as read
   */
  @SubscribeMessage('read')
  async handleRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    try {
      const { conversationId } = data;

      if (!conversationId) {
        throw new WsException('Conversation ID is required');
      }

      // Verify access and update read status
      const talk = await this.prismaService.talk.findUnique({
        where: { id: conversationId },
      });

      if (!talk || (talk.senderId !== client.userId && talk.receiverId !== client.userId)) {
        throw new WsException('Access denied');
      }

      // Update read status
      const updateData = talk.senderId === client.userId
        ? { senderRead: true }
        : { receiverRead: true };

      await this.prismaService.talk.update({
        where: { id: conversationId },
        data: updateData,
      });

      // Notify other user that messages were read
      client.to(`conversation:${conversationId}`).emit('read', {
        userId: client.userId,
        conversationId,
        readAt: new Date(),
      });

      this.logger.log(`Messages marked as read in conversation ${conversationId} by user ${client.userId}`);

      return {
        success: true,
        message: 'Messages marked as read',
      };
    } catch (error) {
      this.logger.error(`Error marking messages as read: ${error.message}`);
      throw new WsException(error.message || 'Failed to mark messages as read');
    }
  }

  /**
   * Real-time offer status updates
   */
  @SubscribeMessage('offer-update')
  async handleOfferUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; offerId: string; status: string },
  ) {
    try {
      const { conversationId, offerId, status } = data;

      if (!conversationId || !offerId) {
        throw new WsException('Conversation ID and offer ID are required');
      }

      // Verify access
      const offer = await this.prismaService.offer.findUnique({
        where: { id: offerId },
        include: {
          sender: { select: { id: true, username: true } },
          receiver: { select: { id: true, username: true } },
        },
      });

      if (!offer || (offer.senderId !== client.userId && offer.receiverId !== client.userId)) {
        throw new WsException('Access denied');
      }

      // Broadcast offer update to conversation
      this.server.to(`conversation:${conversationId}`).emit('offer-update', {
        offerId,
        conversationId,
        status,
        offer,
        updatedAt: new Date(),
      });

      // Notify individual users
      const otherUserId = offer.senderId === client.userId ? offer.receiverId : offer.senderId;
      this.emitToUser(otherUserId, 'offer-notification', {
        conversationId,
        offerId,
        status,
        offer,
      });

      this.logger.log(`Offer ${offerId} updated in conversation ${conversationId}`);

      return {
        success: true,
        message: 'Offer update broadcasted',
      };
    } catch (error) {
      this.logger.error(`Error handling offer update: ${error.message}`);
      throw new WsException(error.message || 'Failed to handle offer update');
    }
  }

  /**
   * Verify JWT token
   */
  private async verifyToken(token: string): Promise<any> {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET'),
      });
      return payload;
    } catch (error) {
      this.logger.error(`Token verification failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Emit event to all sockets of a specific user
   */
  private emitToUser(userId: string, event: string, data: any) {
    const userSockets = this.activeConnections.get(userId);
    if (userSockets) {
      userSockets.forEach(socketId => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.activeConnections.has(userId);
  }

  /**
   * Get all active user IDs
   */
  getActiveUsers(): string[] {
    return Array.from(this.activeConnections.keys());
  }

  /**
   * Broadcast message to conversation (used by service layer)
   */
  broadcastToConversation(conversationId: string, event: string, data: any) {
    this.server.to(`conversation:${conversationId}`).emit(event, data);
  }

  /**
   * Send notification to specific user (used by service layer)
   */
  sendToUser(userId: string, event: string, data: any) {
    this.emitToUser(userId, event, data);
  }
}
