/**
 * User Model
 * Handles user-related database operations
 */

import { BaseModel } from './base-model';
import { User as IUser } from '../types';
import { QueryBuilder } from '../query-builder';
import bcrypt from 'bcrypt';

export class UserModel extends BaseModel<IUser> {
  protected tableName = 'users' as const;

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<IUser | null> {
    return this.findOne({ email });
  }

  /**
   * Find user by slug
   */
  async findBySlug(slug: string): Promise<IUser | null> {
    return this.findOne({ slug });
  }

  /**
   * Create a new user with password hashing
   */
  async createUser(data: Partial<IUser> & { password: string }): Promise<IUser> {
    const { password, ...userData } = data;

    // Hash the password
    const saltRounds = 10;
    const encrypted_password = await bcrypt.hash(password, saltRounds);

    return this.create({
      ...userData,
      encrypted_password,
      role: data.role || 'user',
      sign_in_count: 0,
      failed_attempts: 0,
      disabled_notifications: [],
      disabled_text_notifications: [],
      disabled_push_notifications: [],
      enabled_features: [],
      featured: false,
      display_rating: 0,
      deals_count: 0,
      noindex: false,
      settings: {},
      onboarding_state: 'not_started',
      nonprofit: false,
    });
  }

  /**
   * Verify user password
   */
  async verifyPassword(user: IUser, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.encrypted_password);
  }

  /**
   * Update user sign-in information
   */
  async updateSignIn(userId: number, ipAddress: string): Promise<IUser> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return this.update(userId, {
      sign_in_count: user.sign_in_count + 1,
      last_sign_in_at: user.current_sign_in_at,
      last_sign_in_ip: user.current_sign_in_ip,
      current_sign_in_at: new Date(),
      current_sign_in_ip: ipAddress,
    });
  }

  /**
   * Get active users (not deleted, not deactivated)
   */
  async getActiveUsers(limit: number = 50): Promise<IUser[]> {
    const query = new QueryBuilder()
      .from(this.tableName)
      .whereNull('deleted_at')
      .whereNull('deactivated_at')
      .orderBy('created_at', 'DESC')
      .limit(limit)
      .toSQL();

    return this.query<IUser>(query.text, query.params);
  }

  /**
   * Get featured users
   */
  async getFeaturedUsers(): Promise<IUser[]> {
    return this.findWhere({ featured: true });
  }

  /**
   * Search users by name or email
   */
  async search(searchTerm: string, limit: number = 20): Promise<IUser[]> {
    const query = `
      SELECT * FROM users
      WHERE deleted_at IS NULL
        AND (
          first_name ILIKE $1
          OR last_name ILIKE $1
          OR email ILIKE $1
          OR slug ILIKE $1
        )
      ORDER BY sign_in_count DESC
      LIMIT $2
    `;

    return this.query<IUser>(query, [`%${searchTerm}%`, limit]);
  }

  /**
   * Get user with their services
   */
  async getUserWithServices(userId: number): Promise<{
    user: IUser;
    services: any[];
  } | null> {
    const user = await this.findById(userId);
    if (!user) {
      return null;
    }

    const servicesQuery = `
      SELECT * FROM services
      WHERE user_id = $1
        AND deleted_at IS NULL
        AND is_active = true
      ORDER BY created_at DESC
    `;

    const services = await this.query(servicesQuery, [userId]);

    return {
      user,
      services,
    };
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: number): Promise<{
    servicesCount: number;
    talksCount: number;
    reviewsCount: number;
    rating: number | null;
  }> {
    const query = `
      SELECT
        (SELECT COUNT(*) FROM services WHERE user_id = $1 AND deleted_at IS NULL) as services_count,
        (SELECT COUNT(*) FROM talk_users WHERE user_id = $1 AND deleted_at IS NULL) as talks_count,
        (SELECT COUNT(*) FROM reviews WHERE user_id = $1 AND deleted_at IS NULL) as reviews_count,
        (SELECT rating FROM users WHERE id = $1) as rating
    `;

    const result = await this.queryOne<{
      services_count: string;
      talks_count: string;
      reviews_count: string;
      rating: number | null;
    }>(query, [userId]);

    return {
      servicesCount: result ? parseInt(result.services_count, 10) : 0,
      talksCount: result ? parseInt(result.talks_count, 10) : 0,
      reviewsCount: result ? parseInt(result.reviews_count, 10) : 0,
      rating: result?.rating || null,
    };
  }

  /**
   * Update user rating
   */
  async updateRating(userId: number): Promise<IUser> {
    // Calculate average rating from reviews
    const query = `
      SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
      FROM reviews
      WHERE user_id = $1
        AND deleted_at IS NULL
        AND approved_at IS NOT NULL
    `;

    const result = await this.queryOne<{
      avg_rating: number;
      review_count: string;
    }>(query, [userId]);

    const rating = result?.avg_rating || 0;
    const display_rating = Math.round(rating);

    return this.update(userId, {
      rating,
      display_rating,
    });
  }

  /**
   * Deactivate user account
   */
  async deactivate(userId: number, reason?: string): Promise<IUser> {
    return this.update(userId, {
      deactivated_at: new Date(),
      deactivation_reason: reason,
    });
  }

  /**
   * Reactivate user account
   */
  async reactivate(userId: number): Promise<IUser> {
    return this.update(userId, {
      deactivated_at: null,
      deactivation_reason: null,
    });
  }
}

// Export singleton instance
export const userModel = new UserModel();
