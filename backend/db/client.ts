/**
 * PostgreSQL Database Client
 * Uses pg library for connection pooling
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

class DatabaseClient {
  private pool: Pool | null = null;
  private config: DatabaseConfig;

  constructor(config?: Partial<DatabaseConfig>) {
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'simbi_development',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
      ...config,
    };
  }

  /**
   * Initialize the database connection pool
   */
  async connect(): Promise<void> {
    if (this.pool) {
      console.warn('Database pool already initialized');
      return;
    }

    try {
      this.pool = new Pool(this.config);

      // Test the connection
      const client = await this.pool.connect();
      console.log('Database connection established successfully');
      client.release();

      // Handle pool errors
      this.pool.on('error', (err: Error) => {
        console.error('Unexpected error on idle client', err);
      });
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }
  }

  /**
   * Close the database connection pool
   */
  async disconnect(): Promise<void> {
    if (!this.pool) {
      return;
    }

    try {
      await this.pool.end();
      this.pool = null;
      console.log('Database connection closed');
    } catch (error) {
      console.error('Error closing database connection:', error);
      throw error;
    }
  }

  /**
   * Execute a query
   */
  async query<T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new Error('Database pool not initialized. Call connect() first.');
    }

    try {
      const start = Date.now();
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;

      if (process.env.LOG_QUERIES === 'true') {
        console.log('Executed query', { text, duration, rows: result.rowCount });
      }

      return result;
    } catch (error) {
      console.error('Query error:', { text, params, error });
      throw error;
    }
  }

  /**
   * Execute a query and return the first row
   */
  async queryOne<T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<T | null> {
    const result = await this.query<T>(text, params);
    return result.rows[0] || null;
  }

  /**
   * Execute a query and return all rows
   */
  async queryMany<T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<T[]> {
    const result = await this.query<T>(text, params);
    return result.rows;
  }

  /**
   * Get a client from the pool for transactions
   */
  async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new Error('Database pool not initialized. Call connect() first.');
    }

    return await this.pool.connect();
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getClient();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Check if the database is connected
   */
  isConnected(): boolean {
    return this.pool !== null;
  }

  /**
   * Get pool statistics
   */
  getPoolStats() {
    if (!this.pool) {
      return null;
    }

    return {
      total: this.pool.totalCount,
      idle: this.pool.idleCount,
      waiting: this.pool.waitingCount,
    };
  }
}

// Export singleton instance
export const db = new DatabaseClient();

// Export class for testing or custom instances
export default DatabaseClient;

// Re-export pg types for convenience
export type { PoolClient, QueryResult, QueryResultRow };
