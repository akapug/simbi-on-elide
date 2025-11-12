import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  PrismaHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { PrismaService } from '../services/prisma.service';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import Redis from 'ioredis';

/**
 * Health Check Controller
 * Provides comprehensive health checks for all critical services
 * Used by load balancers and monitoring systems
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  private redis: Redis;

  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private prismaHealth: PrismaHealthIndicator,
    private prisma: PrismaService,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private configService: ConfigService,
  ) {
    // Initialize Redis client for health checks
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      password: this.configService.get('REDIS_PASSWORD'),
      maxRetriesPerRequest: 3,
      retryStrategy: () => null, // Don't retry on health check failures
    });
  }

  /**
   * Comprehensive health check
   * Checks all critical services: PostgreSQL, Redis, Memory, Disk
   */
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check health of all services' })
  @ApiResponse({ status: 200, description: 'All services are healthy' })
  @ApiResponse({ status: 503, description: 'One or more services are unhealthy' })
  check() {
    return this.health.check([
      // Database health
      () => this.prismaHealth.pingCheck('database', this.prisma),

      // Redis health
      () => this.checkRedis(),

      // MeiliSearch health (if configured)
      () => this.checkMeiliSearch(),

      // Memory health (alert if heap > 1.5GB)
      () => this.memory.checkHeap('memory_heap', 1.5 * 1024 * 1024 * 1024),

      // Memory RSS health (alert if RSS > 2GB)
      () => this.memory.checkRSS('memory_rss', 2 * 1024 * 1024 * 1024),

      // Disk health (alert if > 90% full)
      () =>
        this.disk.checkStorage('disk', {
          path: '/',
          thresholdPercent: 0.9,
        }),
    ]);
  }

  /**
   * Simple ping endpoint for basic health checks
   */
  @Get('ping')
  @ApiOperation({ summary: 'Simple ping health check' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  ping() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: this.configService.get('NODE_ENV'),
    };
  }

  /**
   * Database-only health check
   */
  @Get('database')
  @HealthCheck()
  @ApiOperation({ summary: 'Check PostgreSQL database health' })
  database() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
    ]);
  }

  /**
   * Redis-only health check
   */
  @Get('redis')
  @HealthCheck()
  @ApiOperation({ summary: 'Check Redis health' })
  redis() {
    return this.health.check([() => this.checkRedis()]);
  }

  /**
   * System resources health check
   */
  @Get('system')
  @ApiOperation({ summary: 'Check system resources (memory, CPU, disk)' })
  async system() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      nodeVersion: process.version,
      platform: process.platform,
    };
  }

  /**
   * Custom Redis health indicator
   */
  private async checkRedis(): Promise<HealthIndicatorResult> {
    try {
      await this.redis.ping();
      return {
        redis: {
          status: 'up',
        },
      };
    } catch (error) {
      return {
        redis: {
          status: 'down',
          message: error.message,
        },
      };
    }
  }

  /**
   * Custom MeiliSearch health indicator
   */
  private async checkMeiliSearch(): Promise<HealthIndicatorResult> {
    const meiliHost = this.configService.get('MEILISEARCH_HOST');

    // If MeiliSearch is not configured, skip the check
    if (!meiliHost) {
      return {
        meilisearch: {
          status: 'skipped',
          message: 'MeiliSearch not configured',
        },
      };
    }

    try {
      return await this.http.pingCheck('meilisearch', `${meiliHost}/health`);
    } catch (error) {
      return {
        meilisearch: {
          status: 'down',
          message: error.message,
        },
      };
    }
  }

  /**
   * Clean up Redis connection on module destroy
   */
  onModuleDestroy() {
    this.redis.disconnect();
  }
}
