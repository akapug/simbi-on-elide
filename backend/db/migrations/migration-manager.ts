/**
 * Migration Manager
 * Handles database schema migrations
 */

import { db } from '../client';
import * as fs from 'fs';
import * as path from 'path';

interface Migration {
  version: string;
  name: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
}

export class MigrationManager {
  private migrationsDir: string;

  constructor(migrationsDir?: string) {
    this.migrationsDir = migrationsDir || path.join(__dirname, './');
  }

  /**
   * Ensure migration table exists
   */
  private async ensureMigrationTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY NOT NULL
      );
    `;

    await db.query(query);
  }

  /**
   * Get applied migrations
   */
  private async getAppliedMigrations(): Promise<string[]> {
    await this.ensureMigrationTable();

    const result = await db.queryMany<{ version: string }>(
      'SELECT version FROM schema_migrations ORDER BY version ASC'
    );

    return result.map((row) => row.version);
  }

  /**
   * Mark migration as applied
   */
  private async markAsApplied(version: string): Promise<void> {
    await db.query(
      'INSERT INTO schema_migrations (version) VALUES ($1)',
      [version]
    );
  }

  /**
   * Remove migration record
   */
  private async removeApplied(version: string): Promise<void> {
    await db.query(
      'DELETE FROM schema_migrations WHERE version = $1',
      [version]
    );
  }

  /**
   * Run all pending migrations
   */
  async migrate(): Promise<void> {
    console.log('Running migrations...');

    const applied = await this.getAppliedMigrations();
    const migrations = await this.loadMigrations();

    const pending = migrations.filter((m) => !applied.includes(m.version));

    if (pending.length === 0) {
      console.log('No pending migrations.');
      return;
    }

    for (const migration of pending) {
      console.log(`Running migration: ${migration.version} - ${migration.name}`);

      try {
        await migration.up();
        await this.markAsApplied(migration.version);
        console.log(`✓ Migration ${migration.version} completed`);
      } catch (error) {
        console.error(`✗ Migration ${migration.version} failed:`, error);
        throw error;
      }
    }

    console.log(`Completed ${pending.length} migration(s)`);
  }

  /**
   * Rollback last migration
   */
  async rollback(): Promise<void> {
    console.log('Rolling back last migration...');

    const applied = await this.getAppliedMigrations();

    if (applied.length === 0) {
      console.log('No migrations to rollback.');
      return;
    }

    const lastVersion = applied[applied.length - 1];
    const migrations = await this.loadMigrations();
    const migration = migrations.find((m) => m.version === lastVersion);

    if (!migration) {
      throw new Error(`Migration ${lastVersion} not found`);
    }

    console.log(`Rolling back migration: ${migration.version} - ${migration.name}`);

    try {
      await migration.down();
      await this.removeApplied(migration.version);
      console.log(`✓ Rollback completed`);
    } catch (error) {
      console.error(`✗ Rollback failed:`, error);
      throw error;
    }
  }

  /**
   * Reset database (rollback all migrations)
   */
  async reset(): Promise<void> {
    console.log('Resetting database...');

    const applied = await this.getAppliedMigrations();
    const migrations = await this.loadMigrations();

    for (let i = applied.length - 1; i >= 0; i--) {
      const version = applied[i];
      const migration = migrations.find((m) => m.version === version);

      if (!migration) {
        console.warn(`Migration ${version} not found, skipping`);
        continue;
      }

      console.log(`Rolling back: ${migration.version} - ${migration.name}`);

      try {
        await migration.down();
        await this.removeApplied(migration.version);
      } catch (error) {
        console.error(`✗ Rollback failed for ${version}:`, error);
        throw error;
      }
    }

    console.log('Database reset complete');
  }

  /**
   * Load migration files
   */
  private async loadMigrations(): Promise<Migration[]> {
    const files = fs
      .readdirSync(this.migrationsDir)
      .filter((f) => f.match(/^\d+_.+\.(ts|js)$/) && f !== 'migration-manager.ts')
      .sort();

    const migrations: Migration[] = [];

    for (const file of files) {
      const match = file.match(/^(\d+)_(.+)\.(ts|js)$/);
      if (!match) continue;

      const version = match[1];
      const name = match[2].replace(/_/g, ' ');
      const modulePath = path.join(this.migrationsDir, file);

      try {
        const module = require(modulePath);

        migrations.push({
          version,
          name,
          up: module.up,
          down: module.down,
        });
      } catch (error) {
        console.warn(`Failed to load migration ${file}:`, error);
      }
    }

    return migrations;
  }

  /**
   * Create new migration file
   */
  createMigration(name: string): string {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.]/g, '')
      .slice(0, 14);

    const filename = `${timestamp}_${name.replace(/\s+/g, '_')}.ts`;
    const filepath = path.join(this.migrationsDir, filename);

    const template = `/**
 * Migration: ${name}
 * Created: ${new Date().toISOString()}
 */

import { db } from '../client';

export async function up(): Promise<void> {
  // Write your migration here
  await db.query(\`
    -- Your SQL here
  \`);
}

export async function down(): Promise<void> {
  // Write your rollback here
  await db.query(\`
    -- Your rollback SQL here
  \`);
}
`;

    fs.writeFileSync(filepath, template);
    console.log(`Created migration: ${filename}`);

    return filepath;
  }

  /**
   * Show migration status
   */
  async status(): Promise<void> {
    const applied = await this.getAppliedMigrations();
    const migrations = await this.loadMigrations();

    console.log('Migration Status:');
    console.log('================');

    for (const migration of migrations) {
      const isApplied = applied.includes(migration.version);
      const status = isApplied ? '✓' : '✗';
      console.log(`${status} ${migration.version} - ${migration.name}`);
    }

    console.log(`\nTotal: ${migrations.length}, Applied: ${applied.length}, Pending: ${migrations.length - applied.length}`);
  }
}

// Export singleton instance
export const migrationManager = new MigrationManager();
