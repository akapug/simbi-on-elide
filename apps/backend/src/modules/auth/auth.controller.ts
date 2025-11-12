import { Controller, Post, Body, UseGuards, Get, Req, Delete, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, RefreshTokenDto, SocialAuthDto } from './dto/auth.dto';
import { Request } from 'express';
import { SkipCsrf } from '../../common/guards/csrf.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Extract device info from request for fingerprinting
   */
  private getDeviceInfo(req: Request) {
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '';

    // Basic parsing - could be enhanced with a library like ua-parser-js
    const deviceInfo = {
      userAgent,
      ip: typeof ip === 'string' ? ip : ip[0],
      browser: this.extractBrowser(userAgent),
      os: this.extractOS(userAgent),
      device: this.extractDevice(userAgent),
    };

    return deviceInfo;
  }

  private extractBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private extractOS(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS') || userAgent.includes('iPhone')) return 'iOS';
    return 'Unknown';
  }

  private extractDevice(userAgent: string): string {
    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    return 'Desktop';
  }

  @Post('register')
  @SkipCsrf() // No CSRF token needed for initial registration
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 attempts per hour
  @ApiOperation({ summary: 'Register new user' })
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    const deviceInfo = this.getDeviceInfo(req);
    return this.authService.register(dto, deviceInfo);
  }

  @Post('login')
  @SkipCsrf() // No CSRF token needed for initial login
  @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 attempts per 15 minutes
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const deviceInfo = this.getDeviceInfo(req);
    return this.authService.login(dto, deviceInfo);
  }

  @Post('google')
  @SkipCsrf() // No CSRF token needed for OAuth login
  @ApiOperation({ summary: 'Login/Register with Google' })
  async googleAuth(@Body() dto: SocialAuthDto, @Req() req: Request) {
    const deviceInfo = this.getDeviceInfo(req);
    return this.authService.googleAuth(dto, deviceInfo);
  }

  @Post('facebook')
  @SkipCsrf() // No CSRF token needed for OAuth login
  @ApiOperation({ summary: 'Login/Register with Facebook' })
  async facebookAuth(@Body() dto: SocialAuthDto, @Req() req: Request) {
    const deviceInfo = this.getDeviceInfo(req);
    return this.authService.facebookAuth(dto, deviceInfo);
  }

  @Post('refresh')
  @SkipCsrf() // No CSRF token needed for token refresh
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    const deviceInfo = this.getDeviceInfo(req);
    return this.authService.refreshToken(dto.refreshToken, deviceInfo);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from current device' })
  async logout(@Body() dto: RefreshTokenDto) {
    await this.authService.logout(dto.refreshToken);
    return { message: 'Logged out successfully' };
  }

  @Post('logout-all')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from all devices' })
  async logoutAll(@Req() req: any) {
    await this.authService.logoutAllDevices(req.user.id);
    return { message: 'Logged out from all devices successfully' };
  }

  @Get('sessions')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active sessions' })
  async getSessions(@Req() req: any) {
    return this.authService.getActiveSessions(req.user.id);
  }

  @Delete('sessions/:sessionId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a specific session' })
  async revokeSession(@Req() req: any, @Param('sessionId') sessionId: string) {
    await this.authService.revokeSession(req.user.id, sessionId);
    return { message: 'Session revoked successfully' };
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  async getMe(@Req() req: any) {
    return req.user;
  }
}
