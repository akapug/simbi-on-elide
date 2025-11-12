# Database Layer Documentation

Complete PostgreSQL database layer for Simbi on Elide conversion.

## Overview

This database layer provides:
- **68 tables** from Rails application schema
- **6 custom PostgreSQL ENUMs**
- **TypeScript type definitions** for all models
- **Query builder** with fluent interface
- **Model classes** for key entities (User, Service, Talk, Community)
- **Migration system** for schema management
- **Seed data** for development

## Directory Structure

```
backend/db/
├── schema.sql              # Full PostgreSQL schema (from Rails structure.sql)
├── types.ts               # TypeScript interfaces for all 68 tables
├── client.ts              # PostgreSQL connection pool manager
├── query-builder.ts       # SQL query builder utility
├── seeds.ts               # Database seed data
├── index.ts               # Main entry point
├── models/
│   ├── base-model.ts      # Abstract base model with CRUD operations
│   ├── user.ts            # User model with authentication
│   ├── service.ts         # Service listing model
│   ├── talk.ts            # Messaging/conversation model
│   ├── community.ts       # Community/group model
│   └── index.ts           # Models export
└── migrations/
    └── migration-manager.ts # Migration system
```

## Database Schema

### Custom ENUMs

1. **category_kind**: `service`, `product`
2. **email_template_editor**: `html`, `slim`, `sendgrid`
3. **organization_member_role**: `admin`, `member`, `moderator`
4. **transfer_currency**: `simbi`, `simbi_services`, `usd`
5. **transfer_type**: `deal_accepted`, `deal_completed`, `deal_cancelled`, `credited`, `deposited`
6. **user_category_expert_status**: `active`, `rejected`, `expert`, `top_expert`

### Core Tables (68 total)

**Users & Authentication**
- `users` - User accounts
- `identities` - OAuth identities
- `devices` - Mobile device tokens

**Services & Categories**
- `services` - Service listings
- `categories` - Service categories
- `category_tags` - Category tags
- `favorites` - Favorited services
- `likes` - Service likes

**Messaging**
- `talks` - Conversations
- `talk_users` - Conversation participants
- `talk_items` - Conversation items (polymorphic)
- `messages` - Messages
- `message_attachments` - Message attachments

**Transactions**
- `offers` - Service offers
- `offer_items` - Offer items
- `offer_events` - Offer events
- `orders` - Product orders
- `order_items` - Order items
- `transactions` - Transaction records
- `transfers` - Currency transfers
- `accounts` - User accounts

**Communities**
- `communities` - Community groups
- `community_users` - Community members
- `community_services` - Community services

**Reviews & Ratings**
- `reviews` - User reviews
- `ratings` - Service ratings
- `references` - User references
- `compliments` - Service compliments

**Social**
- `friendships` - User friendships
- `comments` - Comments (polymorphic)
- `flags` - Content flags

## Setup

### 1. Environment Variables

Create a `.env` file:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=simbi_development
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false

# Optional
LOG_QUERIES=true
```

### 2. Install Dependencies

```bash
npm install pg bcrypt
npm install --save-dev @types/pg @types/bcrypt
```

### 3. Create Database

```bash
# Using psql
createdb simbi_development

# Or via SQL
psql -U postgres -c "CREATE DATABASE simbi_development;"
```

### 4. Import Schema

```bash
psql -U postgres -d simbi_development -f backend/db/schema.sql
```

### 5. Run Seeds (Optional)

```bash
npx ts-node backend/db/seeds.ts
```

## Usage

### Initialize Database

```typescript
import { initializeDatabase } from './backend/db';

// Connect and run migrations
await initializeDatabase({
  runMigrations: true,
  runSeeds: false, // Set to true for development
});
```

### Using Models

```typescript
import { userModel, serviceModel, talkModel, communityModel } from './backend/db/models';

// Create a user
const user = await userModel.createUser({
  email: 'user@example.com',
  password: 'securepassword',
  first_name: 'John',
  last_name: 'Doe',
});

// Find user by email
const foundUser = await userModel.findByEmail('user@example.com');

// Verify password
const isValid = await userModel.verifyPassword(foundUser, 'securepassword');

// Get active services
const services = await serviceModel.getActiveServices({
  limit: 20,
  categoryId: 1,
});

// Search services
const results = await serviceModel.search('web development', {
  limit: 10,
});

// Get user's conversations
const talks = await talkModel.getTalksForUser(userId, {
  limit: 20,
});

// Get community members
const members = await communityModel.getCommunityMembers(communityId, {
  limit: 50,
});
```

### Using Query Builder

```typescript
import { query, QueryBuilder } from './backend/db';

// Simple query
const users = await query()
  .from('users')
  .where('role', '=', 'user')
  .whereNull('deleted_at')
  .orderBy('created_at', 'DESC')
  .limit(10)
  .toSQL();

// Complex query with joins
const servicesWithUsers = await query()
  .from('services')
  .select('services.*', 'users.first_name', 'users.last_name')
  .leftJoin('users', 'services.user_id', '=', 'users.id')
  .where('services.is_active', '=', true)
  .whereNull('services.deleted_at')
  .orderBy('services.created_at', 'DESC')
  .toSQL();

// Insert
const insertQuery = QueryBuilder.insert('users', {
  email: 'test@example.com',
  encrypted_password: 'hashed_password',
  role: 'user',
});

// Update
const updateQuery = QueryBuilder.update(
  'users',
  { first_name: 'Jane' },
  { id: 123 }
);

// Soft delete
const deleteQuery = QueryBuilder.softDelete('users', { id: 123 });
```

### Direct Database Queries

```typescript
import { db } from './backend/db';

// Single query
const user = await db.queryOne(
  'SELECT * FROM users WHERE email = $1',
  ['user@example.com']
);

// Multiple results
const users = await db.queryMany(
  'SELECT * FROM users WHERE role = $1 LIMIT $2',
  ['user', 10]
);

// Transactions
await db.transaction(async (client) => {
  await client.query('INSERT INTO users (email) VALUES ($1)', ['test@example.com']);
  await client.query('INSERT INTO accounts (accountable_id) VALUES ($1)', [1]);
});
```

## Migrations

### Create Migration

```typescript
import { migrationManager } from './backend/db';

// Create new migration file
migrationManager.createMigration('add_email_index_to_users');
```

### Run Migrations

```typescript
// Run all pending migrations
await migrationManager.migrate();

// Rollback last migration
await migrationManager.rollback();

// Reset all migrations
await migrationManager.reset();

// Check status
await migrationManager.status();
```

### Migration File Example

```typescript
// migrations/20250112_add_email_index_to_users.ts
import { db } from '../client';

export async function up(): Promise<void> {
  await db.query(`
    CREATE INDEX idx_users_email ON users (email);
  `);
}

export async function down(): Promise<void> {
  await db.query(`
    DROP INDEX IF EXISTS idx_users_email;
  `);
}
```

## Model Classes

### Base Model Features

All models extend `BaseModel` which provides:

- `findById(id)` - Find by primary key
- `findAll(options)` - Find all with filters
- `findOne(where)` - Find single record
- `findWhere(where)` - Find multiple records
- `create(data)` - Create new record
- `update(id, data)` - Update record
- `softDelete(id)` - Soft delete (set deleted_at)
- `delete(id)` - Hard delete
- `count(where)` - Count records
- `exists(where)` - Check existence
- `paginate(page, perPage, options)` - Paginated results

### User Model

```typescript
// Authentication
await userModel.createUser({ email, password, ... });
await userModel.verifyPassword(user, password);
await userModel.updateSignIn(userId, ipAddress);

// Queries
await userModel.findByEmail(email);
await userModel.findBySlug(slug);
await userModel.getActiveUsers(limit);
await userModel.getFeaturedUsers();
await userModel.search(searchTerm, limit);

// Statistics
await userModel.getUserStats(userId);
await userModel.updateRating(userId);

// Account management
await userModel.deactivate(userId, reason);
await userModel.reactivate(userId);
```

### Service Model

```typescript
// Queries
await serviceModel.getActiveServices({ limit, categoryId });
await serviceModel.getServicesByUser(userId);
await serviceModel.getByUserAndSlug(userId, slug);
await serviceModel.getFeaturedServices(limit);
await serviceModel.getPromotedServices(limit);
await serviceModel.search(searchTerm, { limit, categoryId });

// With relations
await serviceModel.getServiceWithUser(serviceId);

// Statistics
await serviceModel.getServiceStats(serviceId);
await serviceModel.incrementViews(serviceId);

// Create
await serviceModel.createService({ user_id, name, description, ... });
```

### Talk Model

```typescript
// Queries
await talkModel.getTalksForUser(userId, { limit, status });
await talkModel.getTalkWithMessages(talkId, userId);

// Actions
await talkModel.createTalk([userId1, userId2], serviceId);
await talkModel.addMessage(talkId, authorId, content);
await talkModel.markAsRead(talkId, userId);
await talkModel.archiveTalk(talkId, userId);
await talkModel.closeTalk(talkId);

// Statistics
await talkModel.getUnreadCount(userId);
```

### Community Model

```typescript
// Queries
await communityModel.findBySubdomain(subdomain);
await communityModel.getFeaturedCommunities(limit);
await communityModel.getPublicCommunities({ limit, offset });
await communityModel.search(searchTerm, limit);

// Members
await communityModel.getCommunityMembers(communityId, { limit, role });
await communityModel.addMember(communityId, userId, role);
await communityModel.removeMember(communityId, userId);
await communityModel.updateMemberRole(communityId, userId, role);

// Permissions
await communityModel.isMember(communityId, userId);
await communityModel.isModerator(communityId, userId);

// Services
await communityModel.getCommunityServices(communityId, { limit, offset });

// Statistics
await communityModel.getCommunityWithStats(communityId);
```

## Testing Connection

```typescript
import { db } from './backend/db';

async function testConnection() {
  try {
    await db.connect();
    console.log('✓ Database connected');

    const result = await db.queryOne('SELECT NOW() as now');
    console.log('✓ Query successful:', result.now);

    const stats = db.getPoolStats();
    console.log('✓ Pool stats:', stats);

    await db.disconnect();
    console.log('✓ Database disconnected');
  } catch (error) {
    console.error('✗ Connection failed:', error);
  }
}

testConnection();
```

## Performance Tips

1. **Use Connection Pooling**: The client automatically uses pg pool
2. **Index Queries**: All foreign keys and common queries are indexed
3. **Soft Deletes**: Use soft deletes (deleted_at) instead of hard deletes
4. **Pagination**: Always use pagination for large datasets
5. **Transactions**: Use transactions for multi-step operations
6. **Prepared Statements**: All queries use parameterized queries

## Table Count Summary

- **Total Tables**: 68
- **Core Entities**: 10 (users, services, talks, communities, etc.)
- **Join Tables**: 8 (community_users, talk_users, etc.)
- **Support Tables**: 50 (ratings, reviews, transactions, etc.)

## Next Steps

1. Create additional model classes as needed
2. Add custom business logic methods to models
3. Implement caching layer for frequently accessed data
4. Add database monitoring and logging
5. Set up database backups and replication
