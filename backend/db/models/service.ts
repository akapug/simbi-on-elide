/**
 * Service Model
 * Handles service listing database operations
 */

import { BaseModel } from './base-model';
import { Service as IService } from '../types';
import { QueryBuilder } from '../query-builder';

export class ServiceModel extends BaseModel<IService> {
  protected tableName = 'services' as const;

  /**
   * Get active services
   */
  async getActiveServices(options?: {
    limit?: number;
    offset?: number;
    categoryId?: number;
  }): Promise<IService[]> {
    const builder = new QueryBuilder()
      .from(this.tableName)
      .whereNull('deleted_at')
      .where('is_active', '=', true)
      .where('searchable', '=', true)
      .orderBy('created_at', 'DESC');

    if (options?.categoryId) {
      builder.where('category_id', '=', options.categoryId);
    }

    if (options?.limit) {
      builder.limit(options.limit);
    }

    if (options?.offset) {
      builder.offset(options.offset);
    }

    const query = builder.toSQL();
    return this.query<IService>(query.text, query.params);
  }

  /**
   * Get services by user ID
   */
  async getServicesByUser(userId: number): Promise<IService[]> {
    return this.findWhere({
      user_id: userId,
      is_active: true,
    });
  }

  /**
   * Get service by user ID and slug
   */
  async getByUserAndSlug(userId: number, slug: string): Promise<IService | null> {
    return this.findOne({
      user_id: userId,
      slug,
    });
  }

  /**
   * Get featured services
   */
  async getFeaturedServices(limit: number = 10): Promise<IService[]> {
    const query = new QueryBuilder()
      .from(this.tableName)
      .whereNull('deleted_at')
      .where('is_active', '=', true)
      .where('featured', '=', true)
      .orderBy('homepage_order', 'ASC')
      .limit(limit)
      .toSQL();

    return this.query<IService>(query.text, query.params);
  }

  /**
   * Get promoted services
   */
  async getPromotedServices(limit: number = 5): Promise<IService[]> {
    return this.findAll({
      where: {
        is_active: true,
        promoted: true,
      },
      orderBy: ['created_at', 'DESC'],
      limit,
    });
  }

  /**
   * Search services
   */
  async search(searchTerm: string, options?: {
    limit?: number;
    categoryId?: number;
  }): Promise<IService[]> {
    let query = `
      SELECT * FROM services
      WHERE deleted_at IS NULL
        AND is_active = true
        AND searchable = true
        AND (
          name ILIKE $1
          OR description ILIKE $1
          OR qualification ILIKE $1
          OR $2 = ANY(tags)
        )
    `;

    const params: any[] = [`%${searchTerm}%`, searchTerm];

    if (options?.categoryId) {
      query += ' AND category_id = $3';
      params.push(options.categoryId);
    }

    query += ' ORDER BY created_at DESC';

    if (options?.limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(options.limit);
    }

    return this.query<IService>(query, params);
  }

  /**
   * Get services by category
   */
  async getByCategory(categoryId: number, options?: {
    limit?: number;
    offset?: number;
  }): Promise<IService[]> {
    return this.findAll({
      where: {
        category_id: categoryId,
        is_active: true,
      },
      orderBy: ['created_at', 'DESC'],
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  /**
   * Get service with user information
   */
  async getServiceWithUser(serviceId: number): Promise<{
    service: IService;
    user: any;
  } | null> {
    const query = `
      SELECT
        s.*,
        json_build_object(
          'id', u.id,
          'first_name', u.first_name,
          'last_name', u.last_name,
          'slug', u.slug,
          'avatar_file_name', u.avatar_file_name,
          'rating', u.rating,
          'display_rating', u.display_rating
        ) as user
      FROM services s
      INNER JOIN users u ON s.user_id = u.id
      WHERE s.id = $1
        AND s.deleted_at IS NULL
        AND u.deleted_at IS NULL
    `;

    const result = await this.queryOne<IService & { user: any }>(query, [serviceId]);

    if (!result) {
      return null;
    }

    const { user, ...service } = result;

    return {
      service: service as IService,
      user,
    };
  }

  /**
   * Increment service views (you'd need a views column)
   */
  async incrementViews(serviceId: number): Promise<void> {
    const query = `
      UPDATE services
      SET quota_used = quota_used + 1
      WHERE id = $1
    `;

    await this.query(query, [serviceId]);
  }

  /**
   * Get service statistics
   */
  async getServiceStats(serviceId: number): Promise<{
    likesCount: number;
    favoritesCount: number;
    offersCount: number;
  }> {
    const query = `
      SELECT
        (SELECT COUNT(*) FROM likes WHERE service_id = $1 AND deleted_at IS NULL) as likes_count,
        (SELECT COUNT(*) FROM favorites WHERE service_id = $1 AND deleted_at IS NULL) as favorites_count,
        (SELECT COUNT(*) FROM offer_items WHERE service_id = $1 AND deleted_at IS NULL) as offers_count
    `;

    const result = await this.queryOne<{
      likes_count: string;
      favorites_count: string;
      offers_count: string;
    }>(query, [serviceId]);

    return {
      likesCount: result ? parseInt(result.likes_count, 10) : 0,
      favoritesCount: result ? parseInt(result.favorites_count, 10) : 0,
      offersCount: result ? parseInt(result.offers_count, 10) : 0,
    };
  }

  /**
   * Create service with slug generation
   */
  async createService(data: Partial<IService> & {
    user_id: number;
    name: string;
    description: string;
  }): Promise<IService> {
    // Generate slug from name
    const slug = await this.generateUniqueSlug(data.name, data.user_id);

    return this.create({
      ...data,
      slug,
      is_active: data.is_active !== undefined ? data.is_active : true,
      kind: data.kind || 0,
      featured: data.featured !== undefined ? data.featured : true,
      tags: data.tags || [],
      no_image: data.no_image !== undefined ? data.no_image : false,
      promoted: data.promoted !== undefined ? data.promoted : false,
      uniquely_simbi: data.uniquely_simbi !== undefined ? data.uniquely_simbi : false,
      quota_used: 0,
      notified_status: 'not_notified',
      searchable: data.searchable !== undefined ? data.searchable : true,
      index_on_main_site: data.index_on_main_site !== undefined ? data.index_on_main_site : true,
      first_published_at: new Date(),
    });
  }

  /**
   * Generate unique slug for service
   */
  private async generateUniqueSlug(name: string, userId: number): Promise<string> {
    let slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let counter = 0;
    let uniqueSlug = slug;

    while (await this.exists({ user_id: userId, slug: uniqueSlug })) {
      counter++;
      uniqueSlug = `${slug}-${counter}`;
    }

    return uniqueSlug;
  }
}

// Export singleton instance
export const serviceModel = new ServiceModel();
