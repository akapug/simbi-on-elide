/**
 * Worker Client
 * Provides API for enqueueing jobs from the main application
 */

import { enqueueJob, scheduleJob, QueueName } from './queue';
import { getWorker } from './registry';

/**
 * Job options
 */
interface JobOptions {
  delay?: number; // Delay in milliseconds
  unique?: boolean; // Deduplicate jobs
  uniqueExpiration?: number; // Unique lock expiration in milliseconds
  scheduledAt?: Date; // Schedule for specific time
}

/**
 * Worker client class - provides simple API for job enqueueing
 */
export class WorkerClient {
  /**
   * Enqueue a job
   */
  static async enqueue(
    workerName: string,
    args: any[],
    options: JobOptions = {}
  ) {
    const worker = getWorker(workerName);

    if (!worker) {
      throw new Error(`Worker not found: ${workerName}`);
    }

    const queueName = worker.queue;

    // Handle scheduled jobs
    if (options.scheduledAt) {
      return scheduleJob(queueName, workerName, args, options.scheduledAt);
    }

    // Enqueue normally
    return enqueueJob(queueName, workerName, args, {
      delay: options.delay,
      unique: options.unique,
      uniqueExpiration: options.uniqueExpiration,
    });
  }

  /**
   * Enqueue with delay (perform_in equivalent)
   */
  static async performIn(
    workerName: string,
    delayMs: number,
    ...args: any[]
  ) {
    return this.enqueue(workerName, args, { delay: delayMs });
  }

  /**
   * Enqueue at specific time (perform_at equivalent)
   */
  static async performAt(
    workerName: string,
    scheduledAt: Date,
    ...args: any[]
  ) {
    return this.enqueue(workerName, args, { scheduledAt });
  }

  /**
   * Enqueue immediately (perform_async equivalent)
   */
  static async performAsync(workerName: string, ...args: any[]) {
    return this.enqueue(workerName, args);
  }

  /**
   * Enqueue with unique constraint
   */
  static async performUnique(
    workerName: string,
    args: any[],
    expirationMs?: number
  ) {
    return this.enqueue(workerName, args, {
      unique: true,
      uniqueExpiration: expirationMs,
    });
  }
}

/**
 * Convenience functions matching Sidekiq API
 */

// Email workers
export const Emails = {
  sendIntro: (userId: number, step: string) =>
    WorkerClient.performAsync('SendIntroWorker', userId, step),

  notifyMessage: (userId: number, talkId: number, messageId: number) =>
    WorkerClient.performAsync('NotifyMessageWorker', userId, talkId, messageId),

  notifyCommentEmail: (commentId: number, commentableId: number) =>
    WorkerClient.performIn('NotifyCommentEmailWorker', 10 * 60 * 1000, commentId, commentableId), // 10 minutes

  sendEngagementFavorited: (userId: number) =>
    WorkerClient.performAsync('SendEngagementFavoritedWorker', userId),

  sendSuggestedServices: (userId: number) =>
    WorkerClient.performAsync('SendSuggestedServicesWorker', userId),
};

// Notification workers
export const Notifications = {
  sendPush: (userId: number, kind: string, message: string, data?: any) =>
    WorkerClient.performAsync('SendPushWorker', userId, kind, message, data),

  sendPushMessage: (userId: number, talkId: number, messageId: number) =>
    WorkerClient.performAsync('SendPushMessageWorker', userId, talkId, messageId),

  sendSms: (userId: number, message: string) =>
    WorkerClient.performAsync('SendSmsWorker', userId, message),

  sendSmsMessage: (userId: number, talkId: number, messageId: number) =>
    WorkerClient.performUnique('SendSmsMessageWorker', [userId, talkId, messageId], 10 * 60 * 1000),

  notifyCompliment: (complimentId: number) =>
    WorkerClient.performAsync('NotifyComplimentWorker', complimentId),

  notifyFavor: (favorId: number) =>
    WorkerClient.performAsync('NotifyFavorWorker', favorId),

  notifyMatch: (matchId: number) =>
    WorkerClient.performAsync('NotifyMatchWorker', matchId),

  notifyNewFollower: (followerId: number, followedId: number) =>
    WorkerClient.performAsync('NotifyNewFollowerWorker', followerId, followedId),
};

// Image workers
export const Images = {
  uploadImage: (imageId: number, uploadId: number) =>
    WorkerClient.performAsync('UploadImageWorker', imageId, uploadId),

  updateAvatar: (userId: number, avatarParams: any, updaterId: number) =>
    WorkerClient.performAsync('UpdateAvatarWorker', userId, avatarParams, updaterId),

  optimizeImage: (imageId: number) =>
    WorkerClient.performAsync('ImageOptimizationWorker', imageId),
};

// Analytics workers
export const Analytics = {
  trackEvent: (userId: number, event: string, properties?: any) =>
    WorkerClient.performUnique('MixpanelTrackWorker', [userId, event, properties || {}]),

  updateUser: (userId: number, properties: any) =>
    WorkerClient.performAsync('MixpanelUpdateUserWorker', userId, properties),

  recordUserEvent: (userId: number, eventType: string, eventData: any) =>
    WorkerClient.performAsync('UserEventTrackerWorker', userId, eventType, eventData),

  recordServiceStats: (serviceId: number, statType: string, value?: number) =>
    WorkerClient.performAsync('RecordServiceStatsWorker', serviceId, statType, value || 1),

  updateDisplayScore: (userId: number) =>
    WorkerClient.performAsync('DisplayScoreWorker', userId),

  removeOldEvents: (userId: number, olderThanDays?: number) =>
    WorkerClient.performAsync('RemoveUserEventsWorker', userId, olderThanDays || 90),

  trackResponseTime: (userId: number, talkId: number, responseTimeSeconds: number) =>
    WorkerClient.performAsync('ResponseTimeWorker', userId, talkId, responseTimeSeconds),
};

// Score workers
export const Scores = {
  calculateScore: (scorableId: number, scorableClass: string, formulaId: number) =>
    WorkerClient.performUnique('ScoreWorker', [scorableId, scorableClass, formulaId]),

  batchCalculateScores: (scorableClass: string, scorableIds: number[], formulaId: number) =>
    WorkerClient.performAsync('ScoreQueryProcessorWorker', scorableClass, scorableIds, formulaId),

  updateRating: (ratableId: number, ratableType: string) =>
    WorkerClient.performAsync('UpdateRatingWorker', ratableId, ratableType),

  recalculateStrength: (userId: number) =>
    WorkerClient.performAsync('RecalculateStrengthWorker', userId),

  notifyLeaderboard: (userId: number, leaderboardType: string, rank: number) =>
    WorkerClient.performAsync('NotifyLeaderboardWorker', userId, leaderboardType, rank),
};

// User workers
export const Users = {
  destroyUser: (userId: number) =>
    WorkerClient.performAsync('DestroyUserWorker', userId),

  syncSocialFriends: (userId: number, provider: string, accessToken: string) =>
    WorkerClient.performAsync('SocialFriendsWorker', userId, provider, accessToken),

  quickster: (userId: number, action: string, params?: any) =>
    WorkerClient.performAsync('QuicksterWorker', userId, action, params || {}),

  paySimbi: (fromUserId: number, toUserId: number, amount: number, reason: string, metadata?: any) =>
    WorkerClient.performAsync('PayingSimbiWorker', fromUserId, toUserId, amount, reason, metadata || {}),

  notifyFriendsNewListing: (serviceId: number, userId: number) =>
    WorkerClient.performAsync('FriendNewListingWorker', serviceId, userId),
};

// Slack workers
export const Slack = {
  notify: (channel: string, userId: number | null, message: string) =>
    WorkerClient.performAsync('SlackNotifierWorker', channel, userId, message),
};

export default WorkerClient;
