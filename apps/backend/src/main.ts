import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './app.module';
import { PrismaService } from './common/services/prisma.service';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Ensure uploads directory exists
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
    console.log(`📁 Created uploads directory: ${uploadsDir}`);
  }

  // Security
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow loading images from CDN
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:', 'http:'],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      },
    }),
  );
  app.enableCors({
    origin: configService.get('FRONTEND_URL') || 'http://localhost:5173',
    credentials: true,
  });

  // Cookie parser for CSRF tokens
  app.use(cookieParser());

  // Compression
  app.use(compression());

  // Static file serving for uploads
  app.useStaticAssets(uploadsDir, {
    prefix: '/uploads/',
    maxAge: '7d', // Cache for 7 days
    setHeaders: (res, path) => {
      // Set proper MIME types and caching headers
      if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
        res.setHeader('Content-Type', 'image/jpeg');
      } else if (path.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      } else if (path.endsWith('.gif')) {
        res.setHeader('Content-Type', 'image/gif');
      } else if (path.endsWith('.webp')) {
        res.setHeader('Content-Type', 'image/webp');
      } else if (path.endsWith('.svg')) {
        res.setHeader('Content-Type', 'image/svg+xml');
      } else if (path.endsWith('.pdf')) {
        res.setHeader('Content-Type', 'application/pdf');
      }

      // Add cache control headers
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      res.setHeader('Access-Control-Allow-Origin', '*');
    },
  });

  // Global prefix
  app.setGlobalPrefix(configService.get('API_PREFIX') || 'api/v1');

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter (production-safe error handling)
  app.useGlobalFilters(new HttpExceptionFilter(configService));

  // Global logging interceptor (request/response logging with request IDs)
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Prisma shutdown hook
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Simbi API')
    .setDescription('Symbiotic Economy Platform - Modern REST API')
    .setVersion('2.0.0')
    .addBearerAuth()
    .addTag('security', 'Security & CSRF Protection')
    .addTag('auth', 'Authentication & Authorization')
    .addTag('users', 'User Management')
    .addTag('services', 'Service Listings')
    .addTag('talks', 'Messaging & Conversations')
    .addTag('communities', 'Community Management')
    .addTag('payments', 'Stripe Payments & Transactions')
    .addTag('reviews', 'Reviews & Ratings')
    .addTag('search', 'Search Functionality')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get('PORT') || 3000;
  await app.listen(port);

  console.log(`
    🚀 Simbi API Server is running!

    📡 API: http://localhost:${port}/${configService.get('API_PREFIX')}
    📚 Docs: http://localhost:${port}/api/docs
    🎯 Environment: ${configService.get('NODE_ENV')}
  `);
}

bootstrap();
