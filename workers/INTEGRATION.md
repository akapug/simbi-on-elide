# Worker System Integration Guide

## Integrating Workers with Simbi Elide Application

This guide shows how to integrate the worker system with your Elide-based Simbi application.

---

## Setup

### 1. Install Dependencies

```bash
# Node.js dependencies
cd /tmp/simbi-on-elide-v2/workers
npm install

# Python dependencies
pip install -r python/requirements.txt

# Ruby dependencies (if using email/notification workers)
cd ruby
bundle install
```

### 2. Environment Configuration

Create `.env` file in workers directory:

```bash
# Redis
REDIS_URL=redis://localhost:6379

# Worker Configuration
WORKER_PORT=3001
NODE_ENV=production

# Mixpanel
MIXPANEL_TOKEN=your_mixpanel_token

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# AWS S3 (Image uploads)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET=simbi-uploads
CDN_URL=https://cdn.simbi.com

# Rails/Database (for Ruby workers)
DATABASE_URL=postgresql://user:pass@localhost/simbi
RAILS_ENV=production
```

### 3. Start Workers

```bash
# Development
npm run workers:dev

# Production
npm run start

# Or with PM2
pm2 start start.ts --name simbi-workers
```

---

## Integration with Backend API

### TypeScript/Elide Backend

```typescript
// backend/src/workers.ts
import { Emails, Notifications, Images, Analytics } from '../workers';

// In your controllers/services:

// Send welcome email after user registration
export async function registerUser(data: UserRegistrationData) {
  const user = await User.create(data);

  // Queue welcome email
  await Emails.sendIntro(user.id, 'first');

  // Track in Mixpanel
  await Analytics.trackEvent(user.id, 'user_registered', {
    source: data.source,
    plan: data.plan,
  });

  return user;
}

// Send notification when user receives a message
export async function createMessage(talkId: number, authorId: number, content: string) {
  const message = await Message.create({ talkId, authorId, content });
  const talk = await Talk.findById(talkId);
  const recipient = talk.getOtherParticipant(authorId);

  // Queue email notification
  await Emails.notifyMessage(recipient.id, talkId, message.id);

  // Queue push notification
  await Notifications.sendPushMessage(recipient.id, talkId, message.id);

  // Queue SMS if user has enabled it
  if (recipient.preferences.smsNotifications) {
    await Notifications.sendSmsMessage(recipient.id, talkId, message.id);
  }

  // Track response time
  const responseTime = calculateResponseTime(talk, message);
  await Analytics.trackResponseTime(authorId, talkId, responseTime);

  return message;
}

// Process image upload
export async function uploadImage(userId: number, file: File) {
  const upload = await Upload.create({ userId, file });
  const image = await Image.create({ userId, status: 'pending' });

  // Queue image processing
  await Images.uploadImage(image.id, upload.id);

  return image;
}

// Update user avatar
export async function updateAvatar(userId: number, avatarData: AvatarData) {
  // Queue avatar processing
  await Images.updateAvatar(userId, avatarData, userId);

  return { status: 'processing' };
}

// Process Simbi payment
export async function processPayment(favorId: number) {
  const favor = await Favor.findById(favorId);

  // Queue payment
  await Users.paySimbi(
    favor.senderId,
    favor.receiverId,
    favor.amount,
    `Payment for: ${favor.service.name}`,
    { favorId: favor.id }
  );

  // Notify recipient
  await Notifications.notifyFavor(favor.id);

  return favor;
}
```

---

## Integration with Ruby Backend (if using Rails)

```ruby
# config/initializers/workers.rb
require 'redis'
require 'json'

class WorkerClient
  def self.redis
    @redis ||= Redis.new(url: ENV['REDIS_URL'])
  end

  def self.enqueue(worker_name, *args)
    # Add to Bull queue via Redis
    queue_name = worker_queue(worker_name)
    job_data = {
      name: worker_name,
      data: { args: args },
      opts: {
        attempts: 3,
        timestamp: Time.now.to_i * 1000
      }
    }

    # Push to Bull queue format
    redis.lpush("bull:#{queue_name}:waiting", job_data.to_json)
  end

  def self.worker_queue(worker_name)
    # Map worker to queue
    case worker_name
    when /Email/, /Intro/, /Engagement/
      'email_templates'
    when /Mixpanel/
      'mixpanel'
    when /Image/, /Avatar/
      'paperclip'
    when /Slack/
      'slack'
    when /PayingSimbi/
      'critical'
    else
      'default'
    end
  end
end

# Usage in Rails:
class User < ApplicationRecord
  after_create :send_welcome_email

  def send_welcome_email
    WorkerClient.enqueue('SendIntroWorker', id, 'first')
  end
end

class Message < ApplicationRecord
  after_create :notify_recipient

  def notify_recipient
    recipient = talk.other_participant(author)
    WorkerClient.enqueue('NotifyMessageWorker', recipient.id, talk_id, id)
    WorkerClient.enqueue('SendPushMessageWorker', recipient.id, talk_id, id)
  end
end
```

---

## Integration Patterns

### 1. Background Job Pattern

```typescript
// Enqueue and forget
await Analytics.trackEvent(userId, 'button_clicked', { button: 'signup' });
```

### 2. Delayed Job Pattern

```typescript
// Send reminder email in 24 hours
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
await WorkerClient.performAt('SendReminderWorker', tomorrow, userId);
```

### 3. Scheduled Job Pattern

```typescript
// Cron-like scheduling (would use node-cron or similar)
import cron from 'node-cron';

// Send daily digest at 9 AM
cron.schedule('0 9 * * *', async () => {
  const users = await User.findActiveUsers();
  for (const user of users) {
    await Emails.sendDailyDigest(user.id);
  }
});
```

### 4. Batch Job Pattern

```typescript
// Recalculate scores for all users
const userIds = await User.getAllIds();
const batchSize = 100;

for (let i = 0; i < userIds.length; i += batchSize) {
  const batch = userIds.slice(i, i + batchSize);
  await Scores.batchCalculateScores('User', batch, formulaId);
}
```

### 5. Unique Job Pattern

```typescript
// Only process once per user per hour
await WorkerClient.performUnique(
  'RecalculateStrengthWorker',
  [userId],
  60 * 60 * 1000 // 1 hour
);
```

---

## Error Handling

### Automatic Retries

Workers automatically retry failed jobs based on queue configuration:

- `default`: 3 attempts with exponential backoff
- `critical`: 5 attempts with exponential backoff
- `mixpanel`: 2 attempts

### Custom Error Handling

```typescript
// In worker implementation
export class MyWorker {
  async perform(arg1: any) {
    try {
      // Your logic
    } catch (error) {
      if (error instanceof RecoverableError) {
        // Let it retry
        throw error;
      } else {
        // Log and skip
        console.error('Non-recoverable error:', error);
        return { success: false, error: error.message };
      }
    }
  }
}
```

---

## Monitoring

### Health Checks

```bash
# Check worker health
curl http://localhost:3001/health

# Get queue statistics
curl http://localhost:3001/stats
```

### Application Monitoring

```typescript
import { getQueueStats } from './workers';

// In your monitoring endpoint
app.get('/api/admin/workers', async (req, res) => {
  const stats = await getQueueStats('default');
  res.json(stats);
});
```

### Alerts

```typescript
// Set up alerting for failed jobs
import { getQueue } from './workers/queue';

const queue = getQueue('default');

queue.on('failed', (job, error) => {
  // Send alert to Sentry, Slack, etc.
  console.error(`Job ${job.id} failed:`, error);

  if (job.attemptsMade >= 3) {
    // Send critical alert
    sendAlert('CRITICAL', `Job ${job.name} permanently failed`);
  }
});
```

---

## Testing

### Unit Testing Workers

```typescript
// worker.test.ts
import { MixpanelTrackWorker } from './typescript/analytics_worker';

describe('MixpanelTrackWorker', () => {
  it('tracks event successfully', async () => {
    const worker = new MixpanelTrackWorker();
    const result = await worker.perform(123, 'test_event', { foo: 'bar' });

    expect(result.success).toBe(true);
    expect(result.event).toBe('test_event');
  });
});
```

### Integration Testing

```typescript
// integration.test.ts
import { WorkerClient } from './workers';
import { getQueue } from './workers/queue';

describe('Worker Integration', () => {
  it('enqueues and processes job', async () => {
    const job = await WorkerClient.performAsync('DisplayScoreWorker', 123);

    // Wait for job to complete
    await job.finished();

    const result = job.returnvalue;
    expect(result.success).toBe(true);
  });
});
```

---

## Performance Tuning

### Concurrency Settings

Adjust concurrency in `definitions.ts`:

```typescript
{
  name: 'MixpanelTrackWorker',
  concurrency: 20, // Increase for higher throughput
}
```

### Queue Priorities

High-priority queues are processed first:

- `critical`: Priority 10 (payments, important operations)
- `email_templates`: Priority 7 (emails)
- `slack`: Priority 6 (notifications)
- `default`: Priority 5 (general)

### Redis Optimization

```bash
# Increase Redis max memory
redis-cli config set maxmemory 2gb
redis-cli config set maxmemory-policy allkeys-lru
```

---

## Production Deployment

### Docker Compose

```yaml
# docker-compose.yml
services:
  workers:
    build: ./workers
    command: npm start
    environment:
      - REDIS_URL=redis://redis:6379
      - NODE_ENV=production
    depends_on:
      - redis
    restart: always

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    restart: always

volumes:
  redis-data:
```

### Kubernetes

```yaml
# workers-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: simbi-workers
spec:
  replicas: 3
  selector:
    matchLabels:
      app: simbi-workers
  template:
    metadata:
      labels:
        app: simbi-workers
    spec:
      containers:
      - name: workers
        image: simbi/workers:latest
        env:
        - name: REDIS_URL
          value: redis://redis-service:6379
        - name: NODE_ENV
          value: production
```

### Process Management (PM2)

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'simbi-workers',
    script: './start.ts',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

---

## Migration from Sidekiq

### Step 1: Run Both Systems in Parallel

```ruby
# Enqueue to both Sidekiq and new worker system
def send_email(user_id)
  # Old system
  SendIntroWorker.perform_async(user_id, 'first')

  # New system
  WorkerClient.enqueue('SendIntroWorker', user_id, 'first')
end
```

### Step 2: Monitor and Compare

- Check both systems process jobs correctly
- Compare performance metrics
- Verify error rates

### Step 3: Switch Traffic

```ruby
# Use feature flag
def send_email(user_id)
  if ENV['USE_NEW_WORKERS'] == 'true'
    WorkerClient.enqueue('SendIntroWorker', user_id, 'first')
  else
    SendIntroWorker.perform_async(user_id, 'first')
  end
end
```

### Step 4: Deprecate Sidekiq

Once confident, remove Sidekiq:

```ruby
# Remove all Sidekiq workers
rm -rf app/workers/

# Remove Sidekiq gem
bundle remove sidekiq

# Update all enqueue calls to use new system
```

---

## Summary

The worker system is fully integrated and production-ready:

✅ **Easy Integration**: Simple API matching Sidekiq patterns
✅ **Type Safety**: Full TypeScript support
✅ **Error Handling**: Automatic retries and error tracking
✅ **Monitoring**: Built-in health checks and statistics
✅ **Performance**: Optimized concurrency and queue priorities
✅ **Production Ready**: Docker, Kubernetes, PM2 support
✅ **Migration Path**: Gradual migration from Sidekiq
