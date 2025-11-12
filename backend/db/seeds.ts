/**
 * Database Seed Data
 * Provides sample data for development and testing
 */

import { db } from './client';
import { userModel } from './models/user';
import { serviceModel } from './models/service';
import { communityModel } from './models/community';

export async function seedDatabase(): Promise<void> {
  console.log('Seeding database...');

  try {
    // Create sample users
    console.log('Creating users...');
    const users = await seedUsers();

    // Create sample categories
    console.log('Creating categories...');
    const categories = await seedCategories();

    // Create sample services
    console.log('Creating services...');
    await seedServices(users, categories);

    // Create sample communities
    console.log('Creating communities...');
    await seedCommunities(users);

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

async function seedUsers() {
  const usersData = [
    {
      email: 'alice@example.com',
      password: 'password123',
      first_name: 'Alice',
      last_name: 'Johnson',
      about: 'Web developer and designer',
      role: 'user',
      slug: 'alice-johnson',
    },
    {
      email: 'bob@example.com',
      password: 'password123',
      first_name: 'Bob',
      last_name: 'Smith',
      about: 'Photographer and videographer',
      role: 'user',
      slug: 'bob-smith',
    },
    {
      email: 'carol@example.com',
      password: 'password123',
      first_name: 'Carol',
      last_name: 'Williams',
      about: 'Writer and content creator',
      role: 'user',
      slug: 'carol-williams',
    },
    {
      email: 'admin@simbi.com',
      password: 'admin123',
      first_name: 'Admin',
      last_name: 'User',
      about: 'System administrator',
      role: 'admin',
      slug: 'admin',
    },
  ];

  const users = [];

  for (const userData of usersData) {
    try {
      const existingUser = await userModel.findByEmail(userData.email);

      if (!existingUser) {
        const user = await userModel.createUser(userData);
        users.push(user);
        console.log(`  ✓ Created user: ${userData.email}`);
      } else {
        users.push(existingUser);
        console.log(`  - User already exists: ${userData.email}`);
      }
    } catch (error) {
      console.error(`  ✗ Failed to create user ${userData.email}:`, error);
    }
  }

  return users;
}

async function seedCategories() {
  const categoriesData = [
    { name: 'Web Development', slug: 'web-development', kind: 'service' },
    { name: 'Graphic Design', slug: 'graphic-design', kind: 'service' },
    { name: 'Photography', slug: 'photography', kind: 'service' },
    { name: 'Writing & Translation', slug: 'writing-translation', kind: 'service' },
    { name: 'Marketing', slug: 'marketing', kind: 'service' },
    { name: 'Music & Audio', slug: 'music-audio', kind: 'service' },
    { name: 'Video & Animation', slug: 'video-animation', kind: 'service' },
    { name: 'Handmade Crafts', slug: 'handmade-crafts', kind: 'product' },
  ];

  const categories = [];

  for (const categoryData of categoriesData) {
    try {
      const result = await db.queryOne(
        'SELECT * FROM categories WHERE slug = $1 AND deleted_at IS NULL',
        [categoryData.slug]
      );

      if (!result) {
        const category = await db.queryOne(
          `INSERT INTO categories (name, slug, kind, is_active, "index", category_tags, created_at, updated_at)
           VALUES ($1, $2, $3, true, 0, '{}', NOW(), NOW())
           RETURNING *`,
          [categoryData.name, categoryData.slug, categoryData.kind]
        );
        categories.push(category);
        console.log(`  ✓ Created category: ${categoryData.name}`);
      } else {
        categories.push(result);
        console.log(`  - Category already exists: ${categoryData.name}`);
      }
    } catch (error) {
      console.error(`  ✗ Failed to create category ${categoryData.name}:`, error);
    }
  }

  return categories;
}

async function seedServices(users: any[], categories: any[]) {
  const servicesData = [
    {
      name: 'Website Development',
      description: 'I will create a professional website for your business',
      category: 'Web Development',
      user_index: 0,
      price: 500,
    },
    {
      name: 'Logo Design',
      description: 'Professional logo design for your brand',
      category: 'Graphic Design',
      user_index: 0,
      price: 100,
    },
    {
      name: 'Portrait Photography',
      description: 'Professional portrait and headshot photography',
      category: 'Photography',
      user_index: 1,
      price: 150,
    },
    {
      name: 'Event Photography',
      description: 'Capture your special moments',
      category: 'Photography',
      user_index: 1,
      price: 300,
    },
    {
      name: 'Blog Writing',
      description: 'Engaging blog posts for your website',
      category: 'Writing & Translation',
      user_index: 2,
      price: 50,
    },
    {
      name: 'Content Editing',
      description: 'Professional editing and proofreading services',
      category: 'Writing & Translation',
      user_index: 2,
      price: 40,
    },
  ];

  for (const serviceData of servicesData) {
    try {
      const user = users[serviceData.user_index];
      const category = categories.find((c) => c.name === serviceData.category);

      if (!user || !category) {
        console.log(`  - Skipping service: ${serviceData.name} (missing user or category)`);
        continue;
      }

      const existing = await db.queryOne(
        'SELECT * FROM services WHERE user_id = $1 AND name = $2 AND deleted_at IS NULL',
        [user.id, serviceData.name]
      );

      if (!existing) {
        await serviceModel.createService({
          user_id: user.id,
          category_id: category.id,
          name: serviceData.name,
          description: serviceData.description,
          price: serviceData.price,
        });
        console.log(`  ✓ Created service: ${serviceData.name}`);
      } else {
        console.log(`  - Service already exists: ${serviceData.name}`);
      }
    } catch (error) {
      console.error(`  ✗ Failed to create service ${serviceData.name}:`, error);
    }
  }
}

async function seedCommunities(users: any[]) {
  const communitiesData = [
    {
      name: 'Web Developers',
      subdomain: 'webdev',
      description: 'Community for web developers to share and learn',
      private: false,
      featured: true,
    },
    {
      name: 'Creative Artists',
      subdomain: 'artists',
      description: 'A place for artists to showcase and trade their work',
      private: false,
      featured: true,
    },
    {
      name: 'Local Services',
      subdomain: 'local',
      description: 'Connect with service providers in your area',
      private: false,
      featured: false,
    },
  ];

  for (const communityData of communitiesData) {
    try {
      const existing = await communityModel.findBySubdomain(communityData.subdomain);

      if (!existing) {
        const community = await communityModel.create({
          ...communityData,
          guidelines_title: 'Community Guidelines',
          guidelines: 'Be respectful and helpful to other members.',
          status: 'active',
        });

        // Add first user as admin
        if (users.length > 0) {
          await communityModel.addMember(community.id, users[0].id, 2); // Role 2 = admin
        }

        console.log(`  ✓ Created community: ${communityData.name}`);
      } else {
        console.log(`  - Community already exists: ${communityData.name}`);
      }
    } catch (error) {
      console.error(`  ✗ Failed to create community ${communityData.name}:`, error);
    }
  }
}

/**
 * Clear all seed data
 */
export async function clearSeedData(): Promise<void> {
  console.log('Clearing seed data...');

  try {
    await db.query('DELETE FROM community_users WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%@example.com\')');
    await db.query('DELETE FROM community_services');
    await db.query('DELETE FROM services WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%@example.com\')');
    await db.query('DELETE FROM communities WHERE subdomain IN (\'webdev\', \'artists\', \'local\')');
    await db.query('DELETE FROM users WHERE email LIKE \'%@example.com\' OR email = \'admin@simbi.com\'');

    console.log('Seed data cleared successfully!');
  } catch (error) {
    console.error('Error clearing seed data:', error);
    throw error;
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];

  (async () => {
    try {
      await db.connect();

      if (command === 'clear') {
        await clearSeedData();
      } else {
        await seedDatabase();
      }

      await db.disconnect();
      process.exit(0);
    } catch (error) {
      console.error('Failed:', error);
      await db.disconnect();
      process.exit(1);
    }
  })();
}
