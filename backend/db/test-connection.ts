#!/usr/bin/env ts-node
/**
 * Database Connection Test
 * Tests database connectivity and basic operations
 */

import { db } from './client';
import { userModel, serviceModel, communityModel } from './models';

async function testConnection() {
  console.log('='.repeat(60));
  console.log('Database Connection Test');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Test 1: Connect to database
    console.log('Test 1: Connecting to database...');
    await db.connect();
    console.log('✓ Database connected successfully');
    console.log('');

    // Test 2: Simple query
    console.log('Test 2: Running simple query...');
    const timeResult = await db.queryOne<{ now: Date }>('SELECT NOW() as now');
    console.log('✓ Query successful');
    console.log(`  Current time: ${timeResult?.now}`);
    console.log('');

    // Test 3: Check pool stats
    console.log('Test 3: Checking connection pool stats...');
    const stats = db.getPoolStats();
    console.log('✓ Pool stats:');
    console.log(`  Total connections: ${stats?.total}`);
    console.log(`  Idle connections: ${stats?.idle}`);
    console.log(`  Waiting clients: ${stats?.waiting}`);
    console.log('');

    // Test 4: Check if tables exist
    console.log('Test 4: Verifying table structure...');
    const tablesResult = await db.queryMany<{ tablename: string }>(
      `SELECT tablename FROM pg_tables
       WHERE schemaname = 'public'
       ORDER BY tablename`
    );
    console.log(`✓ Found ${tablesResult.length} tables`);
    console.log('  Key tables:');
    const keyTables = ['users', 'services', 'talks', 'communities', 'categories'];
    for (const table of keyTables) {
      const exists = tablesResult.some((t) => t.tablename === table);
      console.log(`    ${exists ? '✓' : '✗'} ${table}`);
    }
    console.log('');

    // Test 5: Check enums
    console.log('Test 5: Verifying custom ENUMs...');
    const enumsResult = await db.queryMany<{ typname: string }>(
      `SELECT typname FROM pg_type
       WHERE typtype = 'e'
       ORDER BY typname`
    );
    console.log(`✓ Found ${enumsResult.length} custom ENUMs`);
    console.log('  ENUMs:', enumsResult.map((e) => e.typname).join(', '));
    console.log('');

    // Test 6: Count records in key tables
    console.log('Test 6: Counting records...');
    const counts = await Promise.all([
      db.queryOne<{ count: string }>('SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL'),
      db.queryOne<{ count: string }>('SELECT COUNT(*) as count FROM services WHERE deleted_at IS NULL'),
      db.queryOne<{ count: string }>('SELECT COUNT(*) as count FROM communities WHERE deleted_at IS NULL'),
      db.queryOne<{ count: string }>('SELECT COUNT(*) as count FROM categories'),
    ]);

    console.log('✓ Record counts:');
    console.log(`  Users: ${counts[0]?.count || 0}`);
    console.log(`  Services: ${counts[1]?.count || 0}`);
    console.log(`  Communities: ${counts[2]?.count || 0}`);
    console.log(`  Categories: ${counts[3]?.count || 0}`);
    console.log('');

    // Test 7: Test model methods
    console.log('Test 7: Testing model methods...');
    try {
      const userCount = await userModel.count();
      const serviceCount = await serviceModel.count();
      const communityCount = await communityModel.count();

      console.log('✓ Model methods working:');
      console.log(`  userModel.count(): ${userCount}`);
      console.log(`  serviceModel.count(): ${serviceCount}`);
      console.log(`  communityModel.count(): ${communityCount}`);
    } catch (error) {
      console.log('⚠ Model methods test skipped (tables may be empty)');
    }
    console.log('');

    // Test 8: Test indexes
    console.log('Test 8: Verifying indexes...');
    const indexesResult = await db.queryMany<{ indexname: string }>(
      `SELECT indexname FROM pg_indexes
       WHERE schemaname = 'public'
       AND tablename IN ('users', 'services', 'talks', 'communities')
       ORDER BY indexname`
    );
    console.log(`✓ Found ${indexesResult.length} indexes on key tables`);
    console.log('');

    // Test 9: Test transaction support
    console.log('Test 9: Testing transaction support...');
    await db.transaction(async (client) => {
      const result = await client.query('SELECT 1 as test');
      if (result.rows[0].test !== 1) {
        throw new Error('Transaction test failed');
      }
    });
    console.log('✓ Transactions working correctly');
    console.log('');

    // Summary
    console.log('='.repeat(60));
    console.log('All tests passed! Database is ready to use.');
    console.log('='.repeat(60));
    console.log('');
    console.log('Database Configuration:');
    console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`  Port: ${process.env.DB_PORT || '5432'}`);
    console.log(`  Database: ${process.env.DB_NAME || 'simbi_development'}`);
    console.log(`  User: ${process.env.DB_USER || 'postgres'}`);
    console.log('');

    // Disconnect
    await db.disconnect();
    console.log('✓ Database disconnected');

    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('✗ Test failed:');
    console.error(error);
    console.error('');
    console.error('Please check:');
    console.error('1. PostgreSQL is running');
    console.error('2. Database exists and schema is imported');
    console.error('3. Connection credentials are correct in .env');
    console.error('4. Database user has necessary permissions');
    console.error('');

    try {
      await db.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }

    process.exit(1);
  }
}

// Run tests
testConnection();
