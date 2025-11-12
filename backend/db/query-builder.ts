/**
 * SQL Query Builder
 * Provides fluent interface for building SQL queries
 */

import { TableName, QueryOptions } from './types';

export class QueryBuilder {
  private selectFields: string[] = ['*'];
  private tableName: string = '';
  private whereConditions: string[] = [];
  private joinClauses: string[] = [];
  private orderByClause: string = '';
  private limitValue: number | null = null;
  private offsetValue: number | null = null;
  private params: any[] = [];
  private paramCount: number = 0;

  /**
   * Set the table to query from
   */
  from(table: TableName): this {
    this.tableName = table;
    return this;
  }

  /**
   * Set fields to select
   */
  select(...fields: string[]): this {
    this.selectFields = fields.length > 0 ? fields : ['*'];
    return this;
  }

  /**
   * Add WHERE condition with parameterized query
   */
  where(field: string, operator: string, value: any): this;
  where(conditions: Record<string, any>): this;
  where(
    fieldOrConditions: string | Record<string, any>,
    operator?: string,
    value?: any
  ): this {
    if (typeof fieldOrConditions === 'object') {
      // Handle object of conditions
      Object.entries(fieldOrConditions).forEach(([field, val]) => {
        this.addWhereCondition(field, '=', val);
      });
    } else if (operator && value !== undefined) {
      this.addWhereCondition(fieldOrConditions, operator, value);
    }
    return this;
  }

  /**
   * Add WHERE condition for NULL values
   */
  whereNull(field: string): this {
    this.whereConditions.push(`${field} IS NULL`);
    return this;
  }

  /**
   * Add WHERE condition for NOT NULL values
   */
  whereNotNull(field: string): this {
    this.whereConditions.push(`${field} IS NOT NULL`);
    return this;
  }

  /**
   * Add WHERE IN condition
   */
  whereIn(field: string, values: any[]): this {
    if (values.length === 0) {
      this.whereConditions.push('1=0'); // No matches
      return this;
    }

    const placeholders = values.map(() => {
      this.paramCount++;
      this.params.push(values[this.paramCount - 1 - this.params.length]);
      return `$${this.paramCount}`;
    });

    this.whereConditions.push(`${field} IN (${placeholders.join(', ')})`);
    return this;
  }

  /**
   * Add OR WHERE condition
   */
  orWhere(field: string, operator: string, value: any): this {
    if (this.whereConditions.length > 0) {
      this.paramCount++;
      this.params.push(value);
      this.whereConditions.push(`OR ${field} ${operator} $${this.paramCount}`);
    } else {
      this.where(field, operator, value);
    }
    return this;
  }

  /**
   * Add JOIN clause
   */
  join(
    table: TableName,
    leftField: string,
    operator: string,
    rightField: string,
    type: 'INNER' | 'LEFT' | 'RIGHT' = 'INNER'
  ): this {
    this.joinClauses.push(
      `${type} JOIN ${table} ON ${leftField} ${operator} ${rightField}`
    );
    return this;
  }

  /**
   * Add LEFT JOIN clause
   */
  leftJoin(
    table: TableName,
    leftField: string,
    operator: string,
    rightField: string
  ): this {
    return this.join(table, leftField, operator, rightField, 'LEFT');
  }

  /**
   * Add RIGHT JOIN clause
   */
  rightJoin(
    table: TableName,
    leftField: string,
    operator: string,
    rightField: string
  ): this {
    return this.join(table, leftField, operator, rightField, 'RIGHT');
  }

  /**
   * Add ORDER BY clause
   */
  orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    if (this.orderByClause) {
      this.orderByClause += `, ${field} ${direction}`;
    } else {
      this.orderByClause = `ORDER BY ${field} ${direction}`;
    }
    return this;
  }

  /**
   * Add LIMIT clause
   */
  limit(count: number): this {
    this.limitValue = count;
    return this;
  }

  /**
   * Add OFFSET clause
   */
  offset(count: number): this {
    this.offsetValue = count;
    return this;
  }

  /**
   * Add pagination
   */
  paginate(page: number, perPage: number = 20): this {
    this.limit(perPage);
    this.offset((page - 1) * perPage);
    return this;
  }

  /**
   * Build the SQL query string
   */
  toSQL(): { text: string; params: any[] } {
    if (!this.tableName) {
      throw new Error('Table name is required. Use from() method.');
    }

    const parts: string[] = [
      `SELECT ${this.selectFields.join(', ')}`,
      `FROM ${this.tableName}`,
    ];

    if (this.joinClauses.length > 0) {
      parts.push(this.joinClauses.join(' '));
    }

    if (this.whereConditions.length > 0) {
      parts.push(`WHERE ${this.whereConditions.join(' AND ')}`);
    }

    if (this.orderByClause) {
      parts.push(this.orderByClause);
    }

    if (this.limitValue !== null) {
      parts.push(`LIMIT ${this.limitValue}`);
    }

    if (this.offsetValue !== null) {
      parts.push(`OFFSET ${this.offsetValue}`);
    }

    return {
      text: parts.join(' '),
      params: this.params,
    };
  }

  /**
   * Build INSERT query
   */
  static insert(table: TableName, data: Record<string, any>): { text: string; params: any[] } {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`);

    return {
      text: `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
      params: values,
    };
  }

  /**
   * Build UPDATE query
   */
  static update(
    table: TableName,
    data: Record<string, any>,
    where: Record<string, any>
  ): { text: string; params: any[] } {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');

    const whereFields = Object.keys(where);
    const whereValues = Object.values(where);
    const whereClause = whereFields
      .map((field, i) => `${field} = $${values.length + i + 1}`)
      .join(' AND ');

    return {
      text: `UPDATE ${table} SET ${setClause} WHERE ${whereClause} RETURNING *`,
      params: [...values, ...whereValues],
    };
  }

  /**
   * Build DELETE query
   */
  static delete(table: TableName, where: Record<string, any>): { text: string; params: any[] } {
    const fields = Object.keys(where);
    const values = Object.values(where);
    const whereClause = fields.map((field, i) => `${field} = $${i + 1}`).join(' AND ');

    return {
      text: `DELETE FROM ${table} WHERE ${whereClause} RETURNING *`,
      params: values,
    };
  }

  /**
   * Build soft delete (set deleted_at)
   */
  static softDelete(table: TableName, where: Record<string, any>): { text: string; params: any[] } {
    return QueryBuilder.update(
      table,
      { deleted_at: new Date() },
      where
    );
  }

  /**
   * Helper method to add WHERE condition with parameter
   */
  private addWhereCondition(field: string, operator: string, value: any): void {
    this.paramCount++;
    this.params.push(value);
    this.whereConditions.push(`${field} ${operator} $${this.paramCount}`);
  }

  /**
   * Reset the query builder
   */
  reset(): this {
    this.selectFields = ['*'];
    this.tableName = '';
    this.whereConditions = [];
    this.joinClauses = [];
    this.orderByClause = '';
    this.limitValue = null;
    this.offsetValue = null;
    this.params = [];
    this.paramCount = 0;
    return this;
  }
}

/**
 * Helper function to create a new query builder
 */
export function query(): QueryBuilder {
  return new QueryBuilder();
}

/**
 * Helper function for building WHERE conditions from options
 */
export function buildWhereFromOptions(options?: QueryOptions): {
  where: string;
  params: any[];
} {
  if (!options?.where) {
    return { where: '', params: [] };
  }

  const conditions: string[] = [];
  const params: any[] = [];
  let paramCount = 0;

  Object.entries(options.where).forEach(([field, value]) => {
    paramCount++;
    params.push(value);
    conditions.push(`${field} = $${paramCount}`);
  });

  return {
    where: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
}
