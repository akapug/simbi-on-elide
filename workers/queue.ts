/**
 * Redis-backed job queue using Bull
 * Replacement for Sidekiq in polyglot Elide runtime
 */

import Bull from 'bull';
import Redis from 'ioredis';

// Redis configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Redis client
const redisClient = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Queue configurations matching original Sidekiq queues
export const QUEUE_CONFIGS = {
  default: { priority: 5, attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
  critical: { priority: 10, attempts: 5, backoff: { type: 'exponential', delay: 1000 } },
  email_templates: { priority: 7, attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
  paperclip: { priority: 4, attempts: 3, backoff: { type: 'exponential', delay: 3000 } },
  mixpanel: { priority: 3, attempts: 2, backoff: { type: 'exponential', delay: 5000 } },
  searchkick: { priority: 4, attempts: 2, backoff: { type: 'exponential', delay: 3000 } },
  slack: { priority: 6, attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
} as const;

export type QueueName = keyof typeof QUEUE_CONFIGS;

// Queue instances
const queues = new Map<string, Bull.Queue>();

/**
 * Get or create a queue for a specific name
 */
export function getQueue(name: QueueName = 'default'): Bull.Queue {
  if (!queues.has(name)) {
    const queue = new Bull(name, {
      redis: REDIS_URL,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
        ...QUEUE_CONFIGS[name],
      },
    });

    // Error handling
    queue.on('error', (error) => {
      console.error(`Queue ${name} error:`, error);
    });

    queue.on('failed', (job, err) => {
      console.error(`Job ${job.id} in queue ${name} failed:`, err);
    });

    queues.set(name, queue);
  }

  return queues.get(name)!;
}

/**
 * Enqueue a job with deduplication support (like Sidekiq unique)
 */
export async function enqueueJob(
  queueName: QueueName,
  workerName: string,
  args: any[],
  options: {
    delay?: number;
    unique?: boolean;
    uniqueKey?: string;
    uniqueExpiration?: number;
  } = {}
): Promise<Bull.Job> {
  const queue = getQueue(queueName);

  const jobOptions: Bull.JobOptions = {
    ...QUEUE_CONFIGS[queueName],
  };

  // Handle delayed jobs
  if (options.delay) {
    jobOptions.delay = options.delay;
  }

  // Handle unique jobs
  if (options.unique) {
    const uniqueKey = options.uniqueKey || JSON.stringify(args);
    jobOptions.jobId = `${workerName}:${uniqueKey}`;

    if (options.uniqueExpiration) {
      // Check if job already exists
      const existingJob = await queue.getJob(jobOptions.jobId);
      if (existingJob) {
        const state = await existingJob.getState();
        if (['waiting', 'active', 'delayed'].includes(state)) {
          console.log(`Job ${jobOptions.jobId} already exists, skipping`);
          return existingJob;
        }
      }
    }
  }

  return queue.add(workerName, { args }, jobOptions);
}

/**
 * Schedule a job to run at a specific time
 */
export async function scheduleJob(
  queueName: QueueName,
  workerName: string,
  args: any[],
  scheduledAt: Date
): Promise<Bull.Job> {
  const delay = scheduledAt.getTime() - Date.now();
  return enqueueJob(queueName, workerName, args, { delay: Math.max(0, delay) });
}

/**
 * Get queue statistics
 */
export async function getQueueStats(queueName: QueueName) {
  const queue = getQueue(queueName);
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return { waiting, active, completed, failed, delayed };
}

/**
 * Close all queues (for graceful shutdown)
 */
export async function closeAllQueues() {
  const closePromises = Array.from(queues.values()).map(q => q.close());
  await Promise.all(closePromises);
  await redisClient.quit();
}

export default {
  getQueue,
  enqueueJob,
  scheduleJob,
  getQueueStats,
  closeAllQueues,
};
