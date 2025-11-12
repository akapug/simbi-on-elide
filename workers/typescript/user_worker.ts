/**
 * User Management Workers
 * Handles user-related background jobs
 */

import Redis from 'ioredis';
import axios from 'axios';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

/**
 * Destroy user worker - handles user account deletion
 */
export class DestroyUserWorker {
  async perform(userId: number) {
    try {
      console.log(`Starting user deletion for user ${userId}`);

      // Delete user data from various stores
      await this.deleteUserFromRedis(userId);
      await this.deleteUserFromDatabase(userId);
      await this.deleteUserFiles(userId);
      await this.deleteUserSocialConnections(userId);

      // Notify external services
      await this.notifyExternalServices(userId);

      return {
        success: true,
        userId,
        deletedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('User deletion error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  private async deleteUserFromRedis(userId: number) {
    const keys = await redis.keys(`user:${userId}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  private async deleteUserFromDatabase(userId: number) {
    // Would execute database deletion
    console.log(`Deleting user ${userId} from database`);
  }

  private async deleteUserFiles(userId: number) {
    // Delete avatars and uploaded files from S3
    console.log(`Deleting files for user ${userId}`);
  }

  private async deleteUserSocialConnections(userId: number) {
    // Delete social media connections
    console.log(`Deleting social connections for user ${userId}`);
  }

  private async notifyExternalServices(userId: number) {
    // Notify analytics services, marketing platforms, etc.
    console.log(`Notifying external services about user ${userId} deletion`);
  }
}

/**
 * Social friends worker - syncs friends from social networks
 */
export class SocialFriendsWorker {
  async perform(userId: number, provider: string, accessToken: string) {
    try {
      const friends = await this.fetchSocialFriends(provider, accessToken);

      // Find matching users in our system
      const matches = await this.findMatchingUsers(friends);

      // Store friend connections
      await this.storeFriendConnections(userId, matches);

      return {
        success: true,
        userId,
        provider,
        friendsFound: friends.length,
        matchesFound: matches.length,
      };
    } catch (error) {
      console.error('Social friends sync error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  private async fetchSocialFriends(
    provider: string,
    accessToken: string
  ): Promise<Array<{ id: string; email: string; name: string }>> {
    switch (provider) {
      case 'facebook':
        return this.fetchFacebookFriends(accessToken);
      case 'google':
        return this.fetchGoogleContacts(accessToken);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  private async fetchFacebookFriends(accessToken: string) {
    const response = await axios.get('https://graph.facebook.com/v12.0/me/friends', {
      params: { access_token: accessToken },
    });

    return response.data.data || [];
  }

  private async fetchGoogleContacts(accessToken: string) {
    const response = await axios.get('https://people.googleapis.com/v1/people/me/connections', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { personFields: 'names,emailAddresses' },
    });

    return (response.data.connections || []).map((contact: any) => ({
      id: contact.resourceName,
      email: contact.emailAddresses?.[0]?.value,
      name: contact.names?.[0]?.displayName,
    }));
  }

  private async findMatchingUsers(friends: any[]): Promise<number[]> {
    // Would query database to find users with matching emails
    // Mock implementation
    return [];
  }

  private async storeFriendConnections(userId: number, friendIds: number[]) {
    // Store in Redis set
    if (friendIds.length > 0) {
      await redis.sadd(`user:${userId}:social_friends`, ...friendIds.map(String));
    }
  }
}

/**
 * Quickster worker - for quick actions/onboarding
 */
export class QuicksterWorker {
  async perform(userId: number, action: string, params: Record<string, any> = {}) {
    try {
      switch (action) {
        case 'complete_profile':
          return this.completeProfile(userId, params);
        case 'add_first_service':
          return this.addFirstService(userId, params);
        case 'send_first_message':
          return this.sendFirstMessage(userId, params);
        default:
          throw new Error(`Unknown quickster action: ${action}`);
      }
    } catch (error) {
      console.error('Quickster error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  private async completeProfile(userId: number, params: Record<string, any>) {
    // Award completion bonus
    await redis.hincrby(`user:${userId}:stats`, 'simbi_balance', 10);

    // Mark profile as complete
    await redis.set(`user:${userId}:profile_complete`, '1');

    // Track event
    console.log(`User ${userId} completed profile`);

    return {
      success: true,
      userId,
      action: 'complete_profile',
      reward: 10,
    };
  }

  private async addFirstService(userId: number, params: Record<string, any>) {
    // Award service creation bonus
    await redis.hincrby(`user:${userId}:stats`, 'simbi_balance', 20);

    // Track milestone
    await redis.set(`user:${userId}:first_service_created`, '1');

    return {
      success: true,
      userId,
      action: 'add_first_service',
      reward: 20,
    };
  }

  private async sendFirstMessage(userId: number, params: Record<string, any>) {
    // Award messaging bonus
    await redis.hincrby(`user:${userId}:stats`, 'simbi_balance', 5);

    // Track milestone
    await redis.set(`user:${userId}:first_message_sent`, '1');

    return {
      success: true,
      userId,
      action: 'send_first_message',
      reward: 5,
    };
  }
}

/**
 * Paying Simbi worker - handles Simbi currency transactions
 */
export class PayingSimbiWorker {
  async perform(
    fromUserId: number,
    toUserId: number,
    amount: number,
    reason: string,
    metadata: Record<string, any> = {}
  ) {
    try {
      // Validate balance
      const fromBalance = await this.getBalance(fromUserId);
      if (fromBalance < amount) {
        return {
          success: false,
          error: 'Insufficient balance',
          balance: fromBalance,
          required: amount,
        };
      }

      // Create transaction
      const transactionId = await this.createTransaction(
        fromUserId,
        toUserId,
        amount,
        reason,
        metadata
      );

      // Update balances
      await redis.hincrby(`user:${fromUserId}:stats`, 'simbi_balance', -amount);
      await redis.hincrby(`user:${toUserId}:stats`, 'simbi_balance', amount);

      // Record in transaction log
      await this.logTransaction(transactionId, fromUserId, toUserId, amount, reason);

      // Notify users
      await this.notifyUsers(fromUserId, toUserId, amount);

      return {
        success: true,
        transactionId,
        fromUserId,
        toUserId,
        amount,
        fromBalance: fromBalance - amount,
        toBalance: await this.getBalance(toUserId),
      };
    } catch (error) {
      console.error('Simbi payment error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  private async getBalance(userId: number): Promise<number> {
    const balance = await redis.hget(`user:${userId}:stats`, 'simbi_balance');
    return parseInt(balance || '0', 10);
  }

  private async createTransaction(
    fromUserId: number,
    toUserId: number,
    amount: number,
    reason: string,
    metadata: Record<string, any>
  ): Promise<string> {
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const transaction = {
      id: transactionId,
      fromUserId,
      toUserId,
      amount,
      reason,
      metadata,
      createdAt: new Date().toISOString(),
    };

    await redis.set(`transaction:${transactionId}`, JSON.stringify(transaction));

    return transactionId;
  }

  private async logTransaction(
    transactionId: string,
    fromUserId: number,
    toUserId: number,
    amount: number,
    reason: string
  ) {
    // Add to user transaction logs
    await redis.lpush(`user:${fromUserId}:transactions`, transactionId);
    await redis.lpush(`user:${toUserId}:transactions`, transactionId);

    // Add to global transaction log
    await redis.lpush('transactions:all', transactionId);

    console.log(
      `Transaction ${transactionId}: ${fromUserId} -> ${toUserId} (${amount} Simbi) - ${reason}`
    );
  }

  private async notifyUsers(fromUserId: number, toUserId: number, amount: number) {
    // Would queue notification workers here
    console.log(`Notifying users about ${amount} Simbi transaction`);
  }
}

/**
 * Friend new listing worker - notifies friends of new services
 */
export class FriendNewListingWorker {
  async perform(serviceId: number, userId: number) {
    try {
      // Get user's friends
      const friendIds = await this.getFriends(userId);

      if (friendIds.length === 0) {
        return { skipped: true, reason: 'No friends to notify' };
      }

      // Get service details
      const service = await this.getServiceDetails(serviceId);

      // Notify each friend
      const notifications: Promise<any>[] = [];
      for (const friendId of friendIds) {
        notifications.push(this.notifyFriend(friendId, userId, service));
      }

      await Promise.all(notifications);

      return {
        success: true,
        serviceId,
        userId,
        friendsNotified: friendIds.length,
      };
    } catch (error) {
      console.error('Friend listing notification error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  private async getFriends(userId: number): Promise<number[]> {
    const friends = await redis.smembers(`user:${userId}:friends`);
    return friends.map(id => parseInt(id, 10));
  }

  private async getServiceDetails(serviceId: number): Promise<Record<string, any>> {
    // Would fetch from database
    return {
      id: serviceId,
      name: 'New Service',
      description: 'Service description',
    };
  }

  private async notifyFriend(friendId: number, userId: number, service: Record<string, any>) {
    // Queue push notification or email
    console.log(`Notifying user ${friendId} about new service from user ${userId}`);
  }
}

export default {
  DestroyUserWorker,
  SocialFriendsWorker,
  QuicksterWorker,
  PayingSimbiWorker,
  FriendNewListingWorker,
};
