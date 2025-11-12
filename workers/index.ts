/**
 * Simbi Workers - Main Export
 * Polyglot worker system for Elide runtime
 */

export { getQueue, enqueueJob, scheduleJob, getQueueStats, closeAllQueues, QueueName } from './queue';
export { registerWorker, getWorker, getAllWorkers, executeWorker, processQueue, startAllWorkers, WorkerDefinition, WorkerRuntime } from './registry';
export { registerAllWorkers } from './definitions';
export { WorkerClient, Emails, Notifications, Images, Analytics, Scores, Users, Slack } from './client';

// Re-export for convenience
import WorkerClient, {
  Emails,
  Notifications,
  Images,
  Analytics,
  Scores,
  Users,
  Slack
} from './client';

export default {
  WorkerClient,
  Emails,
  Notifications,
  Images,
  Analytics,
  Scores,
  Users,
  Slack,
};
