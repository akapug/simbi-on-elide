/**
 * Database Module Index
 * Main entry point for database operations
 */

// Export database client
export { db, default as DatabaseClient } from './client';
export type { PoolClient, QueryResult, QueryResultRow } from './client';

// Export types
export * from './types';

// Export query builder
export { QueryBuilder, query, buildWhereFromOptions } from './query-builder';

// Export models
export * from './models';

// Export migrations
export { MigrationManager, migrationManager } from './migrations/migration-manager';

// Export seeds
export { seedDatabase, clearSeedData } from './seeds';

/**
 * Initialize database connection and run migrations
 */
export async function initializeDatabase(options?: {
  runMigrations?: boolean;
  runSeeds?: boolean;
}): Promise<void> {
  const { db } = require('./client');
  const { migrationManager } = require('./migrations/migration-manager');
  const { seedDatabase } = require('./seeds');

  console.log('Initializing database...');

  try {
    // Connect to database
    await db.connect();
    console.log('✓ Database connected');

    // Run migrations if requested
    if (options?.runMigrations) {
      await migrationManager.migrate();
      console.log('✓ Migrations completed');
    }

    // Run seeds if requested
    if (options?.runSeeds) {
      await seedDatabase();
      console.log('✓ Seeds completed');
    }

    console.log('Database initialization complete!');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  const { db } = require('./client');
  await db.disconnect();
}
