/**
 * Worker Registry - Routes jobs to appropriate language runtime
 * Supports Ruby, Python, and TypeScript workers
 */

import { spawn } from 'child_process';
import path from 'path';
import { getQueue, QueueName } from './queue';

export type WorkerRuntime = 'ruby' | 'python' | 'typescript';

export interface WorkerDefinition {
  name: string;
  runtime: WorkerRuntime;
  queue: QueueName;
  module: string; // File path for Ruby/Python, or import path for TypeScript
  className?: string; // For Ruby/Python class-based workers
  concurrency?: number;
}

// Worker registry - maps worker names to their definitions
const workers = new Map<string, WorkerDefinition>();

/**
 * Register a worker
 */
export function registerWorker(definition: WorkerDefinition) {
  workers.set(definition.name, definition);
  console.log(`Registered ${definition.runtime} worker: ${definition.name} (queue: ${definition.queue})`);
}

/**
 * Get worker definition by name
 */
export function getWorker(name: string): WorkerDefinition | undefined {
  return workers.get(name);
}

/**
 * Get all workers
 */
export function getAllWorkers(): WorkerDefinition[] {
  return Array.from(workers.values());
}

/**
 * Execute a Ruby worker
 */
async function executeRubyWorker(
  definition: WorkerDefinition,
  args: any[]
): Promise<any> {
  return new Promise((resolve, reject) => {
    const workerPath = path.join(__dirname, 'ruby', definition.module);

    // Create Ruby script to execute worker
    const rubyScript = `
require_relative '${workerPath}'
require 'json'

args = JSON.parse('${JSON.stringify(args)}')
worker = ${definition.className || definition.name}.new
result = worker.perform(*args)
puts JSON.generate(result: result)
`;

    const ruby = spawn('ruby', ['-e', rubyScript], {
      env: { ...process.env, RAILS_ENV: process.env.NODE_ENV || 'development' },
    });

    let stdout = '';
    let stderr = '';

    ruby.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    ruby.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ruby.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (e) {
          resolve({ stdout });
        }
      } else {
        reject(new Error(`Ruby worker failed: ${stderr}`));
      }
    });

    ruby.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Execute a Python worker
 */
async function executePythonWorker(
  definition: WorkerDefinition,
  args: any[]
): Promise<any> {
  return new Promise((resolve, reject) => {
    const workerPath = path.join(__dirname, 'python', definition.module);

    const pythonScript = `
import sys
import json
sys.path.insert(0, '${path.dirname(workerPath)}')

from ${path.basename(definition.module, '.py')} import ${definition.className || definition.name}

args = json.loads('${JSON.stringify(args)}')
worker = ${definition.className || definition.name}()
result = worker.perform(*args)
print(json.dumps({'result': result}))
`;

    const python = spawn('python3', ['-c', pythonScript], {
      env: process.env,
    });

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    python.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (e) {
          resolve({ stdout });
        }
      } else {
        reject(new Error(`Python worker failed: ${stderr}`));
      }
    });

    python.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Execute a TypeScript worker
 */
async function executeTypeScriptWorker(
  definition: WorkerDefinition,
  args: any[]
): Promise<any> {
  const workerModule = await import(definition.module);
  const WorkerClass = workerModule.default || workerModule[definition.className || definition.name];

  if (!WorkerClass) {
    throw new Error(`Worker class not found: ${definition.className || definition.name}`);
  }

  const worker = new WorkerClass();
  return worker.perform(...args);
}

/**
 * Execute a worker based on its runtime
 */
export async function executeWorker(
  name: string,
  args: any[]
): Promise<any> {
  const definition = getWorker(name);

  if (!definition) {
    throw new Error(`Worker not found: ${name}`);
  }

  console.log(`Executing ${definition.runtime} worker: ${name} with args:`, args);

  switch (definition.runtime) {
    case 'ruby':
      return executeRubyWorker(definition, args);
    case 'python':
      return executePythonWorker(definition, args);
    case 'typescript':
      return executeTypeScriptWorker(definition, args);
    default:
      throw new Error(`Unknown runtime: ${definition.runtime}`);
  }
}

/**
 * Process jobs for a specific queue
 */
export function processQueue(queueName: QueueName, concurrency: number = 5) {
  const queue = getQueue(queueName);

  queue.process('*', concurrency, async (job) => {
    const { args } = job.data;
    const workerName = job.name;

    try {
      const result = await executeWorker(workerName, args);
      console.log(`Job ${job.id} completed:`, result);
      return result;
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      throw error;
    }
  });

  console.log(`Processing queue ${queueName} with concurrency ${concurrency}`);
}

/**
 * Start all worker queues
 */
export function startAllWorkers() {
  const queueNames = new Set(
    Array.from(workers.values()).map(w => w.queue)
  );

  queueNames.forEach(queueName => {
    // Get max concurrency for this queue
    const queueWorkers = Array.from(workers.values()).filter(w => w.queue === queueName);
    const maxConcurrency = Math.max(...queueWorkers.map(w => w.concurrency || 5));

    processQueue(queueName, maxConcurrency);
  });

  console.log(`Started ${queueNames.size} worker queues processing ${workers.size} workers`);
}

export default {
  registerWorker,
  getWorker,
  getAllWorkers,
  executeWorker,
  processQueue,
  startAllWorkers,
};
