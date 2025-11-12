/**
 * Base Model Class
 * Provides common CRUD operations for all models
 */

import { db } from '../client';
import { QueryBuilder } from '../query-builder';
import { TableName, BaseModel as IBaseModel } from '../types';

export abstract class BaseModel<T extends IBaseModel> {
  protected abstract tableName: TableName;

  /**
   * Find a record by ID
   */
  async findById(id: number): Promise<T | null> {
    const query = new QueryBuilder()
      .from(this.tableName)
      .where('id', '=', id)
      .whereNull('deleted_at')
      .toSQL();

    return await db.queryOne<T>(query.text, query.params);
  }

  /**
   * Find all records
   */
  async findAll(options?: {
    where?: Record<string, any>;
    orderBy?: [string, 'ASC' | 'DESC'];
    limit?: number;
    offset?: number;
  }): Promise<T[]> {
    const builder = new QueryBuilder().from(this.tableName);

    if (options?.where) {
      builder.where(options.where);
    }

    builder.whereNull('deleted_at');

    if (options?.orderBy) {
      builder.orderBy(options.orderBy[0], options.orderBy[1]);
    }

    if (options?.limit) {
      builder.limit(options.limit);
    }

    if (options?.offset) {
      builder.offset(options.offset);
    }

    const query = builder.toSQL();
    return await db.queryMany<T>(query.text, query.params);
  }

  /**
   * Find one record by conditions
   */
  async findOne(where: Record<string, any>): Promise<T | null> {
    const builder = new QueryBuilder()
      .from(this.tableName)
      .where(where)
      .whereNull('deleted_at')
      .limit(1);

    const query = builder.toSQL();
    return await db.queryOne<T>(query.text, query.params);
  }

  /**
   * Find records by conditions
   */
  async findWhere(where: Record<string, any>): Promise<T[]> {
    const builder = new QueryBuilder()
      .from(this.tableName)
      .where(where)
      .whereNull('deleted_at');

    const query = builder.toSQL();
    return await db.queryMany<T>(query.text, query.params);
  }

  /**
   * Create a new record
   */
  async create(data: Partial<T>): Promise<T> {
    const now = new Date();
    const recordData = {
      ...data,
      created_at: now,
      updated_at: now,
    };

    const query = QueryBuilder.insert(this.tableName, recordData);
    const result = await db.queryOne<T>(query.text, query.params);

    if (!result) {
      throw new Error('Failed to create record');
    }

    return result;
  }

  /**
   * Update a record by ID
   */
  async update(id: number, data: Partial<T>): Promise<T> {
    const updateData = {
      ...data,
      updated_at: new Date(),
    };

    const query = QueryBuilder.update(
      this.tableName,
      updateData,
      { id }
    );

    const result = await db.queryOne<T>(query.text, query.params);

    if (!result) {
      throw new Error('Failed to update record or record not found');
    }

    return result;
  }

  /**
   * Soft delete a record (set deleted_at timestamp)
   */
  async softDelete(id: number): Promise<T> {
    const query = QueryBuilder.softDelete(this.tableName, { id });
    const result = await db.queryOne<T>(query.text, query.params);

    if (!result) {
      throw new Error('Failed to delete record or record not found');
    }

    return result;
  }

  /**
   * Hard delete a record (permanently remove)
   */
  async delete(id: number): Promise<T> {
    const query = QueryBuilder.delete(this.tableName, { id });
    const result = await db.queryOne<T>(query.text, query.params);

    if (!result) {
      throw new Error('Failed to delete record or record not found');
    }

    return result;
  }

  /**
   * Count records
   */
  async count(where?: Record<string, any>): Promise<number> {
    const builder = new QueryBuilder()
      .from(this.tableName)
      .select('COUNT(*) as count')
      .whereNull('deleted_at');

    if (where) {
      builder.where(where);
    }

    const query = builder.toSQL();
    const result = await db.queryOne<{ count: string }>(query.text, query.params);

    return result ? parseInt(result.count, 10) : 0;
  }

  /**
   * Check if record exists
   */
  async exists(where: Record<string, any>): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }

  /**
   * Get paginated results
   */
  async paginate(
    page: number,
    perPage: number = 20,
    options?: {
      where?: Record<string, any>;
      orderBy?: [string, 'ASC' | 'DESC'];
    }
  ): Promise<{
    data: T[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }> {
    const builder = new QueryBuilder()
      .from(this.tableName)
      .whereNull('deleted_at');

    if (options?.where) {
      builder.where(options.where);
    }

    if (options?.orderBy) {
      builder.orderBy(options.orderBy[0], options.orderBy[1]);
    }

    const total = await this.count(options?.where);
    const totalPages = Math.ceil(total / perPage);

    builder.paginate(page, perPage);

    const query = builder.toSQL();
    const data = await db.queryMany<T>(query.text, query.params);

    return {
      data,
      total,
      page,
      perPage,
      totalPages,
    };
  }

  /**
   * Execute a raw query
   */
  protected async query<R = any>(text: string, params?: any[]): Promise<R[]> {
    return await db.queryMany<R>(text, params);
  }

  /**
   * Execute a raw query and get one result
   */
  protected async queryOne<R = any>(text: string, params?: any[]): Promise<R | null> {
    return await db.queryOne<R>(text, params);
  }
}
