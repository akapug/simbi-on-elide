/**
 * Worker Definitions
 * Registers all workers with the worker registry
 */

import { registerWorker, WorkerDefinition } from './registry';

/**
 * Email Workers (Ruby - preserve ActionMailer)
 */
const emailWorkers: WorkerDefinition[] = [
  {
    name: 'NotifyMessageWorker',
    runtime: 'ruby',
    queue: 'default',
    module: 'email_worker.rb',
    className: 'NotifyMessageWorker',
    concurrency: 10,
  },
  {
    name: 'SendIntroWorker',
    runtime: 'ruby',
    queue: 'email_templates',
    module: 'email_worker.rb',
    className: 'SendIntroWorker',
    concurrency: 5,
  },
  {
    name: 'NotifyCommentEmailWorker',
    runtime: 'ruby',
    queue: 'default',
    module: 'email_worker.rb',
    className: 'NotifyCommentEmailWorker',
    concurrency: 10,
  },
  {
    name: 'SendEngagementFavoritedWorker',
    runtime: 'ruby',
    queue: 'email_templates',
    module: 'email_worker.rb',
    className: 'SendEngagementFavoritedWorker',
    concurrency: 5,
  },
  {
    name: 'SendSuggestedServicesWorker',
    runtime: 'ruby',
    queue: 'email_templates',
    module: 'email_worker.rb',
    className: 'SendSuggestedServicesWorker',
    concurrency: 5,
  },
];

/**
 * Notification Workers (Ruby - Push, SMS, Slack)
 */
const notificationWorkers: WorkerDefinition[] = [
  {
    name: 'SendPushWorker',
    runtime: 'ruby',
    queue: 'default',
    module: 'notification_worker.rb',
    className: 'SendPushWorker',
    concurrency: 15,
  },
  {
    name: 'SendPushMessageWorker',
    runtime: 'ruby',
    queue: 'default',
    module: 'notification_worker.rb',
    className: 'SendPushMessageWorker',
    concurrency: 15,
  },
  {
    name: 'SendSmsWorker',
    runtime: 'ruby',
    queue: 'default',
    module: 'notification_worker.rb',
    className: 'SendSmsWorker',
    concurrency: 10,
  },
  {
    name: 'SendSmsMessageWorker',
    runtime: 'ruby',
    queue: 'default',
    module: 'notification_worker.rb',
    className: 'SendSmsMessageWorker',
    concurrency: 10,
  },
  {
    name: 'SlackNotifierWorker',
    runtime: 'ruby',
    queue: 'slack',
    module: 'notification_worker.rb',
    className: 'SlackNotifierWorker',
    concurrency: 5,
  },
  {
    name: 'NotifyComplimentWorker',
    runtime: 'ruby',
    queue: 'default',
    module: 'notification_worker.rb',
    className: 'NotifyComplimentWorker',
    concurrency: 10,
  },
  {
    name: 'NotifyFavorWorker',
    runtime: 'ruby',
    queue: 'default',
    module: 'notification_worker.rb',
    className: 'NotifyFavorWorker',
    concurrency: 10,
  },
  {
    name: 'NotifyMatchWorker',
    runtime: 'ruby',
    queue: 'default',
    module: 'notification_worker.rb',
    className: 'NotifyMatchWorker',
    concurrency: 10,
  },
  {
    name: 'NotifyNewFollowerWorker',
    runtime: 'ruby',
    queue: 'default',
    module: 'notification_worker.rb',
    className: 'NotifyNewFollowerWorker',
    concurrency: 10,
  },
];

/**
 * Image Processing Workers (Python - PIL/Pillow)
 */
const imageWorkers: WorkerDefinition[] = [
  {
    name: 'UploadImageWorker',
    runtime: 'python',
    queue: 'paperclip',
    module: 'image_worker.py',
    className: 'UploadImageWorker',
    concurrency: 5,
  },
  {
    name: 'UpdateAvatarWorker',
    runtime: 'python',
    queue: 'paperclip',
    module: 'image_worker.py',
    className: 'UpdateAvatarWorker',
    concurrency: 5,
  },
  {
    name: 'ImageOptimizationWorker',
    runtime: 'python',
    queue: 'paperclip',
    module: 'image_worker.py',
    className: 'ImageOptimizationWorker',
    concurrency: 3,
  },
];

/**
 * Analytics Workers (TypeScript)
 */
const analyticsWorkers: WorkerDefinition[] = [
  {
    name: 'MixpanelTrackWorker',
    runtime: 'typescript',
    queue: 'mixpanel',
    module: './typescript/analytics_worker',
    className: 'MixpanelTrackWorker',
    concurrency: 10,
  },
  {
    name: 'MixpanelUpdateUserWorker',
    runtime: 'typescript',
    queue: 'mixpanel',
    module: './typescript/analytics_worker',
    className: 'MixpanelUpdateUserWorker',
    concurrency: 5,
  },
  {
    name: 'UserEventTrackerWorker',
    runtime: 'typescript',
    queue: 'default',
    module: './typescript/analytics_worker',
    className: 'UserEventTrackerWorker',
    concurrency: 15,
  },
  {
    name: 'RecordServiceStatsWorker',
    runtime: 'typescript',
    queue: 'default',
    module: './typescript/analytics_worker',
    className: 'RecordServiceStatsWorker',
    concurrency: 10,
  },
  {
    name: 'DisplayScoreWorker',
    runtime: 'typescript',
    queue: 'default',
    module: './typescript/analytics_worker',
    className: 'DisplayScoreWorker',
    concurrency: 5,
  },
  {
    name: 'RemoveUserEventsWorker',
    runtime: 'typescript',
    queue: 'default',
    module: './typescript/analytics_worker',
    className: 'RemoveUserEventsWorker',
    concurrency: 3,
  },
  {
    name: 'ResponseTimeWorker',
    runtime: 'typescript',
    queue: 'default',
    module: './typescript/analytics_worker',
    className: 'ResponseTimeWorker',
    concurrency: 10,
  },
];

/**
 * Score Workers (TypeScript)
 */
const scoreWorkers: WorkerDefinition[] = [
  {
    name: 'ScoreWorker',
    runtime: 'typescript',
    queue: 'searchkick',
    module: './typescript/score_worker',
    className: 'ScoreWorker',
    concurrency: 5,
  },
  {
    name: 'ScoreQueryProcessorWorker',
    runtime: 'typescript',
    queue: 'searchkick',
    module: './typescript/score_worker',
    className: 'ScoreQueryProcessorWorker',
    concurrency: 3,
  },
  {
    name: 'UpdateRatingWorker',
    runtime: 'typescript',
    queue: 'default',
    module: './typescript/score_worker',
    className: 'UpdateRatingWorker',
    concurrency: 10,
  },
  {
    name: 'RecalculateStrengthWorker',
    runtime: 'typescript',
    queue: 'default',
    module: './typescript/score_worker',
    className: 'RecalculateStrengthWorker',
    concurrency: 5,
  },
  {
    name: 'NotifyLeaderboardWorker',
    runtime: 'typescript',
    queue: 'default',
    module: './typescript/score_worker',
    className: 'NotifyLeaderboardWorker',
    concurrency: 5,
  },
];

/**
 * User Management Workers (TypeScript)
 */
const userWorkers: WorkerDefinition[] = [
  {
    name: 'DestroyUserWorker',
    runtime: 'typescript',
    queue: 'default',
    module: './typescript/user_worker',
    className: 'DestroyUserWorker',
    concurrency: 2,
  },
  {
    name: 'SocialFriendsWorker',
    runtime: 'typescript',
    queue: 'default',
    module: './typescript/user_worker',
    className: 'SocialFriendsWorker',
    concurrency: 5,
  },
  {
    name: 'QuicksterWorker',
    runtime: 'typescript',
    queue: 'default',
    module: './typescript/user_worker',
    className: 'QuicksterWorker',
    concurrency: 10,
  },
  {
    name: 'PayingSimbiWorker',
    runtime: 'typescript',
    queue: 'critical',
    module: './typescript/user_worker',
    className: 'PayingSimbiWorker',
    concurrency: 5,
  },
  {
    name: 'FriendNewListingWorker',
    runtime: 'typescript',
    queue: 'default',
    module: './typescript/user_worker',
    className: 'FriendNewListingWorker',
    concurrency: 5,
  },
];

/**
 * Register all workers
 */
export function registerAllWorkers() {
  const allWorkers = [
    ...emailWorkers,
    ...notificationWorkers,
    ...imageWorkers,
    ...analyticsWorkers,
    ...scoreWorkers,
    ...userWorkers,
  ];

  allWorkers.forEach(worker => registerWorker(worker));

  console.log(`Registered ${allWorkers.length} workers across ${new Set(allWorkers.map(w => w.queue)).size} queues`);

  return {
    total: allWorkers.length,
    byRuntime: {
      ruby: emailWorkers.length + notificationWorkers.length,
      python: imageWorkers.length,
      typescript: analyticsWorkers.length + scoreWorkers.length + userWorkers.length,
    },
    byQueue: allWorkers.reduce((acc, w) => {
      acc[w.queue] = (acc[w.queue] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
}

export default {
  emailWorkers,
  notificationWorkers,
  imageWorkers,
  analyticsWorkers,
  scoreWorkers,
  userWorkers,
  registerAllWorkers,
};
