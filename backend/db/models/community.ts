/**
 * Community Model
 * Handles community/group database operations
 */

import { BaseModel } from './base-model';
import { Community as ICommunity } from '../types';
import { QueryBuilder } from '../query-builder';

export class CommunityModel extends BaseModel<ICommunity> {
  protected tableName = 'communities' as const;

  /**
   * Find community by subdomain
   */
  async findBySubdomain(subdomain: string): Promise<ICommunity | null> {
    return this.findOne({ subdomain });
  }

  /**
   * Get featured communities
   */
  async getFeaturedCommunities(limit: number = 10): Promise<ICommunity[]> {
    return this.findAll({
      where: { featured: true },
      orderBy: ['created_at', 'DESC'],
      limit,
    });
  }

  /**
   * Get promoted communities
   */
  async getPromotedCommunities(limit: number = 5): Promise<ICommunity[]> {
    return this.findAll({
      where: { promoted: true },
      orderBy: ['created_at', 'DESC'],
      limit,
    });
  }

  /**
   * Get public communities
   */
  async getPublicCommunities(options?: {
    limit?: number;
    offset?: number;
  }): Promise<ICommunity[]> {
    return this.findAll({
      where: { private: false },
      orderBy: ['created_at', 'DESC'],
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  /**
   * Search communities
   */
  async search(searchTerm: string, limit: number = 20): Promise<ICommunity[]> {
    const query = `
      SELECT * FROM communities
      WHERE deleted_at IS NULL
        AND (
          name ILIKE $1
          OR description ILIKE $1
          OR subdomain ILIKE $1
        )
      ORDER BY featured DESC, created_at DESC
      LIMIT $2
    `;

    return this.query<ICommunity>(query, [`%${searchTerm}%`, limit]);
  }

  /**
   * Get community with members count
   */
  async getCommunityWithStats(communityId: number): Promise<{
    community: ICommunity;
    membersCount: number;
    servicesCount: number;
  } | null> {
    const community = await this.findById(communityId);
    if (!community) {
      return null;
    }

    const statsQuery = `
      SELECT
        (SELECT COUNT(*) FROM community_users WHERE community_id = $1 AND deleted_at IS NULL AND joined = true) as members_count,
        (SELECT COUNT(*) FROM community_services WHERE community_id = $1 AND deleted_at IS NULL) as services_count
    `;

    const stats = await this.queryOne<{
      members_count: string;
      services_count: string;
    }>(statsQuery, [communityId]);

    return {
      community,
      membersCount: stats ? parseInt(stats.members_count, 10) : 0,
      servicesCount: stats ? parseInt(stats.services_count, 10) : 0,
    };
  }

  /**
   * Get community members
   */
  async getCommunityMembers(communityId: number, options?: {
    limit?: number;
    offset?: number;
    role?: number;
  }): Promise<Array<{
    user: any;
    role: number;
    joined_at: Date;
    last_visited_at: Date | null;
  }>> {
    let query = `
      SELECT
        json_build_object(
          'id', u.id,
          'first_name', u.first_name,
          'last_name', u.last_name,
          'slug', u.slug,
          'avatar_file_name', u.avatar_file_name,
          'rating', u.rating
        ) as user,
        cu.role,
        cu.created_at as joined_at,
        cu.last_visited_at
      FROM community_users cu
      INNER JOIN users u ON cu.user_id = u.id
      WHERE cu.community_id = $1
        AND cu.deleted_at IS NULL
        AND cu.joined = true
        AND u.deleted_at IS NULL
    `;

    const params: any[] = [communityId];

    if (options?.role !== undefined) {
      query += ` AND cu.role = $${params.length + 1}`;
      params.push(options.role);
    }

    query += ' ORDER BY cu.created_at DESC';

    if (options?.limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(options.limit);
    }

    if (options?.offset) {
      query += ` OFFSET $${params.length + 1}`;
      params.push(options.offset);
    }

    return this.query(query, params);
  }

  /**
   * Get community services
   */
  async getCommunityServices(communityId: number, options?: {
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    let query = `
      SELECT s.*
      FROM services s
      INNER JOIN community_services cs ON s.id = cs.service_id
      WHERE cs.community_id = $1
        AND cs.deleted_at IS NULL
        AND s.deleted_at IS NULL
        AND s.is_active = true
      ORDER BY s.created_at DESC
    `;

    const params: any[] = [communityId];

    if (options?.limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(options.limit);
    }

    if (options?.offset) {
      query += ` OFFSET $${params.length + 1}`;
      params.push(options.offset);
    }

    return this.query(query, params);
  }

  /**
   * Add user to community
   */
  async addMember(
    communityId: number,
    userId: number,
    role: number = 0
  ): Promise<void> {
    const query = QueryBuilder.insert('community_users', {
      community_id: communityId,
      user_id: userId,
      role,
      joined: true,
      created_at: new Date(),
    });

    await this.query(query.text, query.params);
  }

  /**
   * Remove user from community
   */
  async removeMember(communityId: number, userId: number): Promise<void> {
    const query = QueryBuilder.softDelete('community_users', {
      community_id: communityId,
      user_id: userId,
    });

    await this.query(query.text, query.params);
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    communityId: number,
    userId: number,
    role: number
  ): Promise<void> {
    const query = QueryBuilder.update(
      'community_users',
      { role },
      {
        community_id: communityId,
        user_id: userId,
      }
    );

    await this.query(query.text, query.params);
  }

  /**
   * Check if user is member
   */
  async isMember(communityId: number, userId: number): Promise<boolean> {
    const query = `
      SELECT 1 FROM community_users
      WHERE community_id = $1
        AND user_id = $2
        AND deleted_at IS NULL
        AND joined = true
    `;

    const result = await this.queryOne(query, [communityId, userId]);
    return result !== null;
  }

  /**
   * Check if user is admin/moderator
   */
  async isModerator(communityId: number, userId: number): Promise<boolean> {
    const query = `
      SELECT role FROM community_users
      WHERE community_id = $1
        AND user_id = $2
        AND deleted_at IS NULL
        AND joined = true
    `;

    const result = await this.queryOne<{ role: number }>(query, [communityId, userId]);
    // Role 1 = moderator, Role 2 = admin
    return result !== null && result.role >= 1;
  }

  /**
   * Update last visited time for user
   */
  async updateLastVisited(communityId: number, userId: number): Promise<void> {
    const query = `
      UPDATE community_users
      SET last_visited_at = NOW()
      WHERE community_id = $1 AND user_id = $2
    `;

    await this.query(query, [communityId, userId]);
  }
}

// Export singleton instance
export const communityModel = new CommunityModel();
