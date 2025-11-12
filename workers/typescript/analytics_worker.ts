/**
 * Analytics Workers
 * Handles Mixpanel tracking, user events, and statistics
 */

import axios from 'axios';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface MixpanelEvent {
  event: string;
  properties: Record<string, any>;
}

/**
 * Mixpanel tracking worker
 */
export class MixpanelTrackWorker {
  private token: string;
  private apiUrl = 'https://api.mixpanel.com/track';

  constructor() {
    this.token = process.env.MIXPANEL_TOKEN || '';
  }

  async perform(userId: number, event: string, properties: Record<string, any> = {}) {
    if (process.env.NODE_ENV === 'test') {
      return { skipped: true, reason: 'test environment' };
    }

    try {
      const data: MixpanelEvent = {
        event,
        properties: {
          ...properties,
          distinct_id: userId,
          token: this.token,
          time: Date.now(),
        },
      };

      const encodedData = Buffer.from(JSON.stringify(data)).toString('base64');

      await axios.get(this.apiUrl, {
        params: {
          data: encodedData,
          ip: 1,
          verbose: 1,
        },
      });

      console.log(`Mixpanel event tracked: ${event} for user ${userId}`);
      return { success: true, event, userId };
    } catch (error) {
      console.error('Mixpanel tracking error:', error);
      return { success: false, error: (error as Error).message };
    }
  }
}

/**
 * Mixpanel user update worker
 */
export class MixpanelUpdateUserWorker {
  private token: string;
  private apiUrl = 'https://api.mixpanel.com/engage';

  constructor() {
    this.token = process.env.MIXPANEL_TOKEN || '';
  }

  async perform(userId: number, properties: Record<string, any>) {
    if (process.env.NODE_ENV === 'test') {
      return { skipped: true };
    }

    try {
      const data = {
        $token: this.token,
        $distinct_id: userId,
        $set: properties,
      };

      const encodedData = Buffer.from(JSON.stringify(data)).toString('base64');

      await axios.get(this.apiUrl, {
        params: {
          data: encodedData,
          verbose: 1,
        },
      });

      console.log(`Mixpanel user updated: ${userId}`);
      return { success: true, userId };
    } catch (error) {
      console.error('Mixpanel update error:', error);
      return { success: false, error: (error as Error).message };
    }
  }
}

/**
 * User event tracking worker
 */
export class UserEventTrackerWorker {
  async perform(userId: number, eventType: string, eventData: Record<string, any>) {
    try {
      // Store event in database
      await this.storeEvent(userId, eventType, eventData);

      // Track in Mixpanel
      const mixpanelWorker = new MixpanelTrackWorker();
      await mixpanelWorker.perform(userId, eventType, eventData);

      // Update user stats
      await this.updateUserStats(userId, eventType);

      return { success: true, userId, eventType };
    } catch (error) {
      console.error('Event tracking error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  private async storeEvent(userId: number, eventType: string, eventData: Record<string, any>) {
    // Store in database (would use actual DB connection)
    const event = {
      userId,
      eventType,
      eventData,
      createdAt: new Date().toISOString(),
    };

    // Store in Redis for quick access
    await redis.lpush(`user:${userId}:events`, JSON.stringify(event));
    await redis.ltrim(`user:${userId}:events`, 0, 999); // Keep last 1000 events
  }

  private async updateUserStats(userId: number, eventType: string) {
    // Update event counters
    await redis.hincrby(`user:${userId}:stats`, eventType, 1);
    await redis.hincrby(`user:${userId}:stats`, 'total_events', 1);
  }
}

/**
 * Service statistics worker
 */
export class RecordServiceStatsWorker {
  async perform(serviceId: number, statType: string, value: number = 1) {
    try {
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      // Increment stat in Redis
      await redis.hincrby(`service:${serviceId}:stats:${date}`, statType, value);

      // Update all-time stats
      await redis.hincrby(`service:${serviceId}:stats:all_time`, statType, value);

      // Update global stats
      await redis.hincrby(`global:stats:${date}`, statType, value);

      return { success: true, serviceId, statType, value };
    } catch (error) {
      console.error('Service stats error:', error);
      return { success: false, error: (error as Error).message };
    }
  }
}

/**
 * Display score worker - updates cached scores
 */
export class DisplayScoreWorker {
  async perform(userId: number) {
    try {
      // Calculate display score
      const score = await this.calculateScore(userId);

      // Cache in Redis
      await redis.set(`user:${userId}:display_score`, score);
      await redis.expire(`user:${userId}:display_score`, 3600); // 1 hour

      return { success: true, userId, score };
    } catch (error) {
      console.error('Display score error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  private async calculateScore(userId: number): Promise<number> {
    // Get user stats
    const stats = await redis.hgetall(`user:${userId}:stats`);

    // Calculate score based on various factors
    const completedFavors = parseInt(stats.completed_favors || '0', 10);
    const receivedRatings = parseInt(stats.received_ratings || '0', 10);
    const averageRating = parseFloat(stats.average_rating || '0');

    const score = (
      completedFavors * 10 +
      receivedRatings * 5 +
      averageRating * 20
    );

    return Math.round(score);
  }
}

/**
 * Remove user events worker
 */
export class RemoveUserEventsWorker {
  async perform(userId: number, olderThanDays: number = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      // Get all events
      const eventsJson = await redis.lrange(`user:${userId}:events`, 0, -1);
      const events = eventsJson.map(json => JSON.parse(json));

      // Filter events
      const recentEvents = events.filter(event => {
        const eventDate = new Date(event.createdAt);
        return eventDate >= cutoffDate;
      });

      // Replace events list
      await redis.del(`user:${userId}:events`);
      if (recentEvents.length > 0) {
        await redis.lpush(
          `user:${userId}:events`,
          ...recentEvents.map(e => JSON.stringify(e))
        );
      }

      const removedCount = events.length - recentEvents.length;

      return { success: true, userId, removedCount };
    } catch (error) {
      console.error('Remove events error:', error);
      return { success: false, error: (error as Error).message };
    }
  }
}

/**
 * Response time tracking worker
 */
export class ResponseTimeWorker {
  async perform(userId: number, talkId: number, responseTimeSeconds: number) {
    try {
      // Store response time
      await redis.lpush(
        `user:${userId}:response_times`,
        responseTimeSeconds.toString()
      );
      await redis.ltrim(`user:${userId}:response_times`, 0, 99); // Keep last 100

      // Calculate average
      const times = await redis.lrange(`user:${userId}:response_times`, 0, -1);
      const average = times.reduce((sum, time) => sum + parseInt(time, 10), 0) / times.length;

      // Store average
      await redis.set(`user:${userId}:avg_response_time`, Math.round(average));

      return { success: true, userId, talkId, responseTimeSeconds, average };
    } catch (error) {
      console.error('Response time error:', error);
      return { success: false, error: (error as Error).message };
    }
  }
}

export default {
  MixpanelTrackWorker,
  MixpanelUpdateUserWorker,
  UserEventTrackerWorker,
  RecordServiceStatsWorker,
  DisplayScoreWorker,
  RemoveUserEventsWorker,
  ResponseTimeWorker,
};
