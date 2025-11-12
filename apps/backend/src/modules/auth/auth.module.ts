import { Module, DynamicModule, Logger } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { UsersModule } from '../users/users.module';

@Module({})
export class AuthModule {
  static forRoot(): DynamicModule {
    const logger = new Logger('AuthModule');
    const providers: any[] = [AuthService, LocalStrategy, JwtStrategy];

    // Conditionally add OAuth strategies
    const configService = new ConfigService();

    const googleClientId = configService.get('GOOGLE_CLIENT_ID');
    if (googleClientId && !googleClientId.startsWith('your-google-client')) {
      providers.push(GoogleStrategy);
      logger.log('✅ Google OAuth enabled');
    } else {
      logger.warn('⚠️  Google OAuth disabled (credentials not configured)');
    }

    const facebookAppId = configService.get('FACEBOOK_APP_ID');
    if (facebookAppId && !facebookAppId.startsWith('your-facebook-app')) {
      providers.push(FacebookStrategy);
      logger.log('✅ Facebook OAuth enabled');
    } else {
      logger.warn('⚠️  Facebook OAuth disabled (credentials not configured)');
    }

    return {
      module: AuthModule,
      imports: [
        UsersModule,
        PassportModule,
        JwtModule.registerAsync({
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            secret: config.get('JWT_SECRET'),
            signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') || '7d' },
          }),
        }),
      ],
      controllers: [AuthController],
      providers,
      exports: [AuthService],
    };
  }
}
