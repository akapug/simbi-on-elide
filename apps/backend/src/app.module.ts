import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bull';
import { APP_GUARD } from '@nestjs/core';

// Common modules
import { PrismaModule } from './common/modules/prisma.module';
import { HealthModule } from './common/modules/health.module';
import { CsrfModule } from './common/modules/csrf.module';
import { CsrfGuard } from './common/guards/csrf.guard';
import { envValidationSchema } from './common/config/env.validation';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { SecurityLoggerService } from './common/services/security-logger.service';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ServicesModule } from './modules/services/services.module';
import { TalksModule } from './modules/talks/talks.module';
import { CommunitiesModule } from './modules/communities/communities.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { SearchModule } from './modules/search/search.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UploadModule } from './modules/upload/upload.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    // Configuration with validation
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false, // Show all validation errors
        allowUnknown: true, // Allow extra environment variables
      },
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Scheduling
    ScheduleModule.forRoot(),

    // Event emitter
    EventEmitterModule.forRoot(),

    // Bull queue
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
      },
    }),

    // Common
    PrismaModule,
    HealthModule,
    CsrfModule,

    // Features
    AuthModule.forRoot(),
    UsersModule,
    ServicesModule,
    TalksModule,
    CommunitiesModule,
    PaymentsModule,
    ReviewsModule,
    SearchModule,
    NotificationsModule,
    UploadModule,
    AdminModule,
  ],
  providers: [
    // Apply CSRF protection globally to all state-changing requests
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
    // Security logger service (global)
    SecurityLoggerService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply request ID middleware to all routes
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
