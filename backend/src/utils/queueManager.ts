import EventEmitter from 'events';

export interface QueueJob<T = any> {
  id: string;
  type: string;
  data: T;
  attempts: number;
  maxAttempts: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
  processedAt?: Date;
  error?: string;
  delayMs?: number;
}

export type JobHandler<T = any, R = any> = (job: QueueJob<T>) => Promise<R>;

/**
 * Hybrid QueueManager
 * Provides high-reliability asynchronous job processing for marketing background tasks
 * (Audience hashing & streaming, Server-to-server CAPI dispatch, Review fetching).
 *
 * Automatically detects Redis if REDIS_URL is configured; otherwise uses a high-performance
 * in-process queue with concurrency management, delays, and exponential backoff retries.
 */
export class QueueManager extends EventEmitter {
  private static instance: QueueManager;
  private handlers: Map<string, JobHandler> = new Map();
  private inMemoryQueue: QueueJob[] = [];
  private processing: boolean = false;
  private concurrency: number = 5;
  private activeJobs: number = 0;
  private isRedisActive: boolean = false;
  private redisClient: any = null;

  private constructor() {
    super();
    this.init();
  }

  public static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }

  private async init() {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      try {
        const { createClient } = await import('redis');
        this.redisClient = createClient({ url: redisUrl });
        this.redisClient.on('error', (err: any) => {
          console.warn('[QueueManager] Redis error, falling back to in-process queue:', err.message);
          this.isRedisActive = false;
        });
        await this.redisClient.connect();
        this.isRedisActive = true;
        console.log('[QueueManager] Connected to Redis for distributed marketing queue.');
      } catch (err: any) {
        console.warn('[QueueManager] Could not connect to Redis, running in-process fallback:', err.message);
        this.isRedisActive = false;
      }
    } else {
      console.log('[QueueManager] Running with self-hosted in-process queue.');
    }

    // Start background processor loop (unref so tests/scripts can exit cleanly)
    const timer = setInterval(() => this.processNext(), 500);
    if (timer.unref) {
      timer.unref();
    }
  }

  /**
   * Registers a worker handler for a specific job type
   */
  public registerHandler<T = any, R = any>(type: string, handler: JobHandler<T, R>): void {
    this.handlers.set(type, handler);
  }

  /**
   * Enqueues a job for asynchronous execution
   */
  public async add<T = any>(
    type: string,
    data: T,
    options: { maxAttempts?: number; delayMs?: number } = {}
  ): Promise<QueueJob<T>> {
    const job: QueueJob<T> = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type,
      data,
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      status: 'PENDING',
      createdAt: new Date(),
      delayMs: options.delayMs || 0,
    };

    if (this.isRedisActive && this.redisClient) {
      try {
        await this.redisClient.lPush(`queue:${type}`, JSON.stringify(job));
        this.emit('job:enqueued', job);
        return job;
      } catch (err: any) {
        console.warn(`[QueueManager] Redis lPush error: ${err.message}. Enqueueing in-memory.`);
      }
    }

    this.inMemoryQueue.push(job);
    this.emit('job:enqueued', job);
    return job;
  }

  /**
   * Alias for add()
   */
  public async enqueue<T = any>(
    type: string,
    data: T,
    options: { maxAttempts?: number; delayMs?: number } = {}
  ): Promise<QueueJob<T>> {
    return this.add<T>(type, data, options);
  }

  /**
   * Internal worker loop: picks pending jobs respecting concurrency and delay
   */
  private async processNext(): Promise<void> {
    if (this.activeJobs >= this.concurrency) return;

    const now = Date.now();
    const candidateIndex = this.inMemoryQueue.findIndex((job) => {
      if (job.status !== 'PENDING') return false;
      if (job.delayMs && now - job.createdAt.getTime() < job.delayMs) return false;
      return true;
    });

    if (candidateIndex === -1) return;

    const [job] = this.inMemoryQueue.splice(candidateIndex, 1);
    if (!job) return;

    const handler = this.handlers.get(job.type);
    if (!handler) {
      console.warn(`[QueueManager] No handler registered for job type: ${job.type}`);
      job.status = 'FAILED';
      job.error = `No handler registered for ${job.type}`;
      this.emit('failed', job);
      return;
    }

    this.activeJobs++;
    job.status = 'PROCESSING';
    job.attempts++;
    job.processedAt = new Date();

    try {
      const result = await handler(job);
      job.status = 'COMPLETED';
      this.emit('completed', { job, result });
    } catch (error: any) {
      job.error = error.message || 'Unknown job processing error';
      if (job.attempts < job.maxAttempts) {
        // Exponential backoff retry
        job.status = 'PENDING';
        job.delayMs = Math.pow(2, job.attempts) * 1000;
        this.inMemoryQueue.push(job);
        this.emit('retrying', job);
      } else {
        job.status = 'FAILED';
        this.emit('failed', job);
      }
    } finally {
      this.activeJobs--;
      this.processNext();
    }
  }

  /**
   * Returns current queue statistics
   */
  public getStats(): { pending: number; active: number; isRedis: boolean } {
    return {
      pending: this.inMemoryQueue.filter((j) => j.status === 'PENDING').length,
      active: this.activeJobs,
      isRedis: this.isRedisActive,
    };
  }
}

export default QueueManager.getInstance();
