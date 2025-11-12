#!/usr/bin/env node
/**
 * Worker Launcher
 * Starts all worker processes for the Simbi polyglot runtime
 */

import { registerAllWorkers } from './definitions';
import { startAllWorkers } from './registry';
import { getQueueStats, closeAllQueues } from './queue';

// Handle graceful shutdown
let isShuttingDown = false;

async function shutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\nReceived ${signal}, shutting down gracefully...`);

  try {
    // Close all queues
    await closeAllQueues();
    console.log('All queues closed');

    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

/**
 * Main worker startup
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Simbi Worker System - Polyglot Runtime');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Register all workers
    console.log('Registering workers...');
    const stats = registerAllWorkers();

    console.log('');
    console.log('Worker Registration Summary:');
    console.log(`  Total workers: ${stats.total}`);
    console.log('  By runtime:');
    console.log(`    Ruby: ${stats.byRuntime.ruby} workers (emails, notifications)`);
    console.log(`    Python: ${stats.byRuntime.python} workers (image processing)`);
    console.log(`    TypeScript: ${stats.byRuntime.typescript} workers (analytics, scoring, users)`);
    console.log('  By queue:');
    Object.entries(stats.byQueue).forEach(([queue, count]) => {
      console.log(`    ${queue}: ${count} workers`);
    });

    console.log('');
    console.log('Starting worker queues...');

    // Start all workers
    startAllWorkers();

    console.log('');
    console.log('✓ Worker system started successfully');
    console.log('');
    console.log('Monitoring queues (press Ctrl+C to stop)...');
    console.log('');

    // Start monitoring
    startMonitoring();
  } catch (error) {
    console.error('Failed to start worker system:', error);
    process.exit(1);
  }
}

/**
 * Monitor queue statistics
 */
function startMonitoring() {
  const queues = ['default', 'critical', 'email_templates', 'paperclip', 'mixpanel', 'searchkick', 'slack'] as const;

  setInterval(async () => {
    try {
      const allStats = await Promise.all(
        queues.map(async (queue) => {
          const stats = await getQueueStats(queue);
          return { queue, ...stats };
        })
      );

      // Only show stats if there's activity
      const hasActivity = allStats.some(s =>
        s.waiting > 0 || s.active > 0 || s.delayed > 0
      );

      if (hasActivity) {
        console.log(`\n[${new Date().toISOString()}] Queue Statistics:`);
        allStats.forEach(stats => {
          if (stats.waiting > 0 || stats.active > 0 || stats.delayed > 0) {
            console.log(
              `  ${stats.queue.padEnd(20)} | ` +
              `Waiting: ${String(stats.waiting).padStart(4)} | ` +
              `Active: ${String(stats.active).padStart(4)} | ` +
              `Delayed: ${String(stats.delayed).padStart(4)} | ` +
              `Completed: ${String(stats.completed).padStart(6)} | ` +
              `Failed: ${String(stats.failed).padStart(4)}`
            );
          }
        });
      }
    } catch (error) {
      console.error('Error fetching queue stats:', error);
    }
  }, 10000); // Every 10 seconds
}

/**
 * Health check endpoint (for monitoring)
 */
function startHealthCheck() {
  const http = require('http');

  const server = http.createServer(async (req: any, res: any) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      }));
    } else if (req.url === '/stats') {
      const queues = ['default', 'critical', 'email_templates', 'paperclip', 'mixpanel', 'searchkick', 'slack'] as const;
      const stats = await Promise.all(
        queues.map(async (queue) => {
          const queueStats = await getQueueStats(queue);
          return { queue, ...queueStats };
        })
      );

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ queues: stats }));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  const port = process.env.WORKER_PORT || 3001;
  server.listen(port, () => {
    console.log(`Health check server listening on port ${port}`);
    console.log(`  Health: http://localhost:${port}/health`);
    console.log(`  Stats: http://localhost:${port}/stats`);
  });
}

// Start the worker system
if (require.main === module) {
  main();
  startHealthCheck();
}

export { main, shutdown };
