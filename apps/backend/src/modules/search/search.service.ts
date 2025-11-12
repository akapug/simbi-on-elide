import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeiliSearch } from 'meilisearch';
import { PrismaService } from '@/common/services/prisma.service';

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private client: MeiliSearch | null = null;
  private enabled = false;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async onModuleInit() {
    const host = this.config.get('MEILI_HOST');
    const apiKey = this.config.get('MEILI_MASTER_KEY');

    if (!host || host === 'http://localhost:7700') {
      // Check if MeiliSearch is actually running
      try {
        this.client = new MeiliSearch({ host: host || 'http://localhost:7700', apiKey });
        await this.client.health();
        this.enabled = true;
        this.logger.log('✅ MeiliSearch connected');
      } catch (error) {
        this.logger.warn('⚠️  MeiliSearch not available - using PostgreSQL full-text search fallback');
        this.enabled = false;
      }
    } else {
      try {
        this.client = new MeiliSearch({ host, apiKey });
        await this.client.health();
        this.enabled = true;
        this.logger.log('✅ MeiliSearch connected');
      } catch (error) {
        this.logger.warn('⚠️  MeiliSearch not available - using PostgreSQL full-text search fallback');
        this.enabled = false;
      }
    }
  }

  async indexService(service: any) {
    if (!this.enabled || !this.client) {
      this.logger.debug('Skipping MeiliSearch indexing (not available)');
      return;
    }

    try {
      const index = this.client.index('services');
      await index.addDocuments([{
        id: service.id,
        title: service.title,
        description: service.description,
        tags: service.tags,
        kind: service.kind,
        tradingType: service.tradingType,
        userId: service.userId,
        categoryId: service.categoryId,
      }]);
    } catch (error) {
      this.logger.warn('Failed to index service in MeiliSearch, continuing without indexing');
    }
  }

  async search(query: string, filters?: any) {
    if (!this.enabled || !this.client) {
      return this.databaseSearch(query, filters);
    }

    try {
      const index = this.client.index('services');
      return await index.search(query, {
        filter: filters,
        limit: 20,
      });
    } catch (error) {
      this.logger.warn('MeiliSearch query failed, falling back to database search');
      return this.databaseSearch(query, filters);
    }
  }

  private async databaseSearch(query: string, filters?: any) {
    // PostgreSQL full-text search fallback
    const where: any = {
      state: 'published',
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (filters) {
      Object.assign(where, filters);
    }

    const services = await this.prisma.service.findMany({
      where,
      take: 20,
      include: {
        user: { select: { id: true, username: true, avatar: true } },
        category: { select: { id: true, name: true } },
      },
      orderBy: { publishedAt: 'desc' },
    });

    // Format to match MeiliSearch response structure
    return {
      hits: services,
      query,
      limit: 20,
      offset: 0,
      estimatedTotalHits: services.length,
    };
  }
}
