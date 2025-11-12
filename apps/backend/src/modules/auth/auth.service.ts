import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/common/services/prisma.service';
import { LoginDto, RegisterDto, SocialAuthDto } from './dto/auth.dto';
import { User } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto, deviceInfo?: any) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // Generate unique username from email
    const baseUsername = dto.email.split('@')[0];
    let username = baseUsername;
    let counter = 1;
    while (await this.prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        username,
        slug: username.toLowerCase(),
        role: 'user',
      },
    });

    // Create account
    await this.prisma.account.create({
      data: {
        userId: user.id,
        simbiBalance: 50, // Welcome bonus!
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, deviceInfo);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(dto: LoginDto, deviceInfo?: any) {
    const user = await this.validateUser(dto.email, dto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email, deviceInfo);

    // Update last seen
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date() },
    });

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async googleAuth(dto: SocialAuthDto, deviceInfo?: any) {
    let user = await this.prisma.user.findFirst({
      where: {
        oauthAccounts: {
          some: {
            provider: 'google',
            providerAccountId: dto.providerId,
          },
        },
      },
    });

    if (!user) {
      // Check if email exists
      user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (user) {
        // Link OAuth account to existing user
        await this.prisma.oAuthAccount.create({
          data: {
            userId: user.id,
            provider: 'google',
            providerAccountId: dto.providerId,
            accessToken: dto.accessToken,
          },
        });
      } else {
        // Create new user
        const username = await this.generateUniqueUsername(dto.email);
        user = await this.prisma.user.create({
          data: {
            email: dto.email,
            firstName: dto.firstName,
            lastName: dto.lastName,
            username,
            slug: username.toLowerCase(),
            avatar: dto.picture,
            emailVerified: true,
            emailVerifiedAt: new Date(),
            oauthAccounts: {
              create: {
                provider: 'google',
                providerAccountId: dto.providerId,
                accessToken: dto.accessToken,
              },
            },
          },
        });

        // Create account
        await this.prisma.account.create({
          data: {
            userId: user.id,
            simbiBalance: 50,
          },
        });
      }
    }

    const tokens = await this.generateTokens(user.id, user.email, deviceInfo);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async facebookAuth(dto: SocialAuthDto, deviceInfo?: any) {
    let user = await this.prisma.user.findFirst({
      where: {
        oauthAccounts: {
          some: {
            provider: 'facebook',
            providerAccountId: dto.providerId,
          },
        },
      },
    });

    if (!user) {
      user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (user) {
        await this.prisma.oAuthAccount.create({
          data: {
            userId: user.id,
            provider: 'facebook',
            providerAccountId: dto.providerId,
            accessToken: dto.accessToken,
          },
        });
      } else {
        const username = await this.generateUniqueUsername(dto.email);
        user = await this.prisma.user.create({
          data: {
            email: dto.email,
            firstName: dto.firstName,
            lastName: dto.lastName,
            username,
            slug: username.toLowerCase(),
            avatar: dto.picture,
            emailVerified: true,
            emailVerifiedAt: new Date(),
            oauthAccounts: {
              create: {
                provider: 'facebook',
                providerAccountId: dto.providerId,
                accessToken: dto.accessToken,
              },
            },
          },
        });

        await this.prisma.account.create({
          data: {
            userId: user.id,
            simbiBalance: 50,
          },
        });
      }
    }

    const tokens = await this.generateTokens(user.id, user.email, deviceInfo);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string, deviceInfo?: any) {
    try {
      // Verify JWT signature and expiration
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });

      // Hash the token to compare with stored hash
      const tokenHash = await bcrypt.hash(refreshToken, 10);

      // Find the stored refresh token
      // Note: We can't directly compare bcrypt hashes, so we need to find all tokens for this user
      // and compare each one
      const storedTokens = await this.prisma.refreshToken.findMany({
        where: {
          userId: payload.sub,
          expiresAt: { gte: new Date() }, // Only non-expired tokens
        },
      });

      // Find matching token by comparing hashes
      let matchingToken = null;
      for (const token of storedTokens) {
        const isMatch = await bcrypt.compare(refreshToken, token.tokenHash);
        if (isMatch) {
          matchingToken = token;
          break;
        }
      }

      if (!matchingToken) {
        throw new UnauthorizedException('Invalid or revoked refresh token');
      }

      // Get user
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }

      // Token rotation: Delete old token, create new one
      await this.prisma.refreshToken.delete({
        where: { id: matchingToken.id },
      });

      const tokens = await this.generateTokens(user.id, user.email, deviceInfo);

      return {
        user: this.sanitizeUser(user),
        ...tokens,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async generateTokens(userId: string, email: string, deviceInfo?: any) {
    const refreshTokenExpiresIn = this.config.get('JWT_REFRESH_EXPIRES_IN') || '30d';

    // Calculate expiration date
    const expiresAt = new Date();
    const days = parseInt(refreshTokenExpiresIn.replace('d', ''));
    expiresAt.setDate(expiresAt.getDate() + days);

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: this.config.get('JWT_SECRET'),
          expiresIn: this.config.get('JWT_EXPIRES_IN') || '7d',
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: this.config.get('JWT_REFRESH_SECRET'),
          expiresIn: refreshTokenExpiresIn,
        },
      ),
    ]);

    // Hash the refresh token before storing
    const tokenHash = await bcrypt.hash(refreshToken, 10);

    // Store the refresh token in the database
    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt,
        deviceInfo: deviceInfo ? {
          userAgent: deviceInfo.userAgent,
          ip: deviceInfo.ip,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          device: deviceInfo.device,
        } : null,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Logout - Delete a specific refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      // Verify the token first
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });

      // Find and delete the matching token
      const storedTokens = await this.prisma.refreshToken.findMany({
        where: { userId: payload.sub },
      });

      for (const token of storedTokens) {
        const isMatch = await bcrypt.compare(refreshToken, token.tokenHash);
        if (isMatch) {
          await this.prisma.refreshToken.delete({
            where: { id: token.id },
          });
          return;
        }
      }
    } catch {
      // Token invalid or already deleted - that's okay
      return;
    }
  }

  /**
   * Logout all devices - Delete all refresh tokens for a user
   */
  async logoutAllDevices(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  /**
   * Get active sessions for a user
   */
  async getActiveSessions(userId: string) {
    const tokens = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        deviceInfo: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    return tokens.map(token => ({
      id: token.id,
      device: token.deviceInfo ? {
        userAgent: (token.deviceInfo as any).userAgent,
        ip: (token.deviceInfo as any).ip,
        browser: (token.deviceInfo as any).browser,
        os: (token.deviceInfo as any).os,
        device: (token.deviceInfo as any).device,
      } : null,
      createdAt: token.createdAt,
      expiresAt: token.expiresAt,
      isCurrent: false, // Could be enhanced to detect current token
    }));
  }

  /**
   * Revoke a specific session by ID
   */
  async revokeSession(userId: string, sessionId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        id: sessionId,
        userId, // Ensure the session belongs to this user
      },
    });
  }

  /**
   * Cleanup expired tokens - Should be run periodically (e.g., via cron job)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    return result.count;
  }

  private async generateUniqueUsername(email: string): Promise<string> {
    const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    let username = baseUsername;
    let counter = 1;

    while (await this.prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    return username;
  }

  private sanitizeUser(user: User) {
    const { password, ...result } = user;
    return result;
  }
}
