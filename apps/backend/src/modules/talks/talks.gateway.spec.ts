import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TalksGateway } from './talks.gateway';
import { TalksService } from './talks.service';
import { PrismaService } from '@/common/services/prisma.service';

describe('TalksGateway', () => {
  let gateway: TalksGateway;
  let jwtService: JwtService;
  let prismaService: PrismaService;
  let talksService: TalksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TalksGateway,
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_SECRET') return 'test-secret';
              return null;
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            talk: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            offer: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: TalksService,
          useValue: {
            sendMessage: jest.fn(),
          },
        },
      ],
    }).compile();

    gateway = module.get<TalksGateway>(TalksGateway);
    jwtService = module.get<JwtService>(JwtService);
    prismaService = module.get<PrismaService>(PrismaService);
    talksService = module.get<TalksService>(TalksService);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should authenticate valid token and allow connection', async () => {
      const mockClient: any = {
        id: 'socket-123',
        handshake: {
          auth: { token: 'valid-token' },
        },
        disconnect: jest.fn(),
        emit: jest.fn(),
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        avatar: null,
      };

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({ sub: 'user-123', email: 'test@example.com' });
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(mockUser as any);

      await gateway.handleConnection(mockClient);

      expect(mockClient.userId).toBe('user-123');
      expect(mockClient.user).toEqual(mockUser);
      expect(mockClient.disconnect).not.toHaveBeenCalled();
      expect(mockClient.emit).toHaveBeenCalledWith('connected', {
        message: 'Successfully connected to WebSocket',
        userId: 'user-123',
      });
    });

    it('should reject connection with invalid token', async () => {
      const mockClient: any = {
        id: 'socket-123',
        handshake: {
          auth: { token: 'invalid-token' },
        },
        disconnect: jest.fn(),
        emit: jest.fn(),
      };

      jest.spyOn(jwtService, 'verifyAsync').mockRejectedValue(new Error('Invalid token'));

      await gateway.handleConnection(mockClient);

      expect(mockClient.disconnect).toHaveBeenCalled();
      expect(mockClient.emit).not.toHaveBeenCalled();
    });

    it('should reject connection without token', async () => {
      const mockClient: any = {
        id: 'socket-123',
        handshake: {
          auth: {},
        },
        disconnect: jest.fn(),
      };

      await gateway.handleConnection(mockClient);

      expect(mockClient.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleJoinConversation', () => {
    it('should allow authorized user to join conversation', async () => {
      const mockClient: any = {
        id: 'socket-123',
        userId: 'user-123',
        user: { username: 'testuser' },
        join: jest.fn(),
        to: jest.fn().mockReturnValue({
          emit: jest.fn(),
        }),
      };

      const mockTalk = {
        id: 'talk-123',
        senderId: 'user-123',
        receiverId: 'user-456',
      };

      jest.spyOn(prismaService.talk, 'findUnique').mockResolvedValue(mockTalk as any);

      const result = await gateway.handleJoinConversation(mockClient, { conversationId: 'talk-123' });

      expect(mockClient.join).toHaveBeenCalledWith('conversation:talk-123');
      expect(result.success).toBe(true);
      expect(result.conversationId).toBe('talk-123');
    });

    it('should reject unauthorized user from joining conversation', async () => {
      const mockClient: any = {
        id: 'socket-123',
        userId: 'user-999',
        user: { username: 'testuser' },
        join: jest.fn(),
      };

      const mockTalk = {
        id: 'talk-123',
        senderId: 'user-123',
        receiverId: 'user-456',
      };

      jest.spyOn(prismaService.talk, 'findUnique').mockResolvedValue(mockTalk as any);

      await expect(
        gateway.handleJoinConversation(mockClient, { conversationId: 'talk-123' })
      ).rejects.toThrow('Access denied to this conversation');

      expect(mockClient.join).not.toHaveBeenCalled();
    });
  });

  describe('isUserOnline', () => {
    it('should return true for online users', async () => {
      const mockClient: any = {
        id: 'socket-123',
        userId: 'user-123',
        handshake: {
          auth: { token: 'valid-token' },
        },
        disconnect: jest.fn(),
        emit: jest.fn(),
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        avatar: null,
      };

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({ sub: 'user-123', email: 'test@example.com' });
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(mockUser as any);

      await gateway.handleConnection(mockClient);

      expect(gateway.isUserOnline('user-123')).toBe(true);
      expect(gateway.isUserOnline('user-456')).toBe(false);
    });
  });
});
