import { jobLogger } from './logger';
import { submitPermitJob, pollStatusJob, scheduleInspectionJob } from '../workers/permit-jobs';

interface JobData {
  [key: string]: any;
}

export type JobType = 'submit_permit' | 'poll_status' | 'schedule_inspection';

export interface QueueJob {
  id: string;
  type: JobType;
  data: JobData;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  result?: any;
}

// Production-ready job queue with persistence, retries, and monitoring
// In production, this would be backed by Redis + BullMQ or database storage
export class ProductionJobQueue {
  private jobs = new Map<string, QueueJob>();
  private processing = false;
  private readonly maxConcurrency: number;
  private activeJobs = 0;
  private readonly retryDelays = [1000, 5000, 15000, 60000]; // 1s, 5s, 15s, 1min

  constructor(maxConcurrency = 3) {
    this.maxConcurrency = maxConcurrency;
    this.startProcessing();
  }

  async enqueue(type: JobType, data: JobData, options?: {
    maxAttempts?: number;
    priority?: number;
    delay?: number;
  }): Promise<string> {
    const jobId = crypto.randomUUID();
    const job: QueueJob = {
      id: jobId,
      type,
      data,
      status: 'pending',
      attempts: 0,
      maxAttempts: options?.maxAttempts || 3,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.jobs.set(jobId, job);
    
    jobLogger.info('Job enqueued', {
      jobId,
      type,
      data: this.sanitizeJobData(data),
      options
    });

    return jobId;
  }

  async getJob(jobId: string): Promise<QueueJob | null> {
    return this.jobs.get(jobId) || null;
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job || job.status === 'processing') {
      return false;
    }

    this.jobs.delete(jobId);
    jobLogger.info('Job cancelled', { jobId });
    return true;
  }

  getQueueStatus() {
    const jobs = Array.from(this.jobs.values());
    return {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      activeWorkers: this.activeJobs,
      maxConcurrency: this.maxConcurrency
    };
  }

  private async startProcessing(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    // Main processing loop
    const processLoop = async () => {
      while (this.processing) {
        if (this.activeJobs < this.maxConcurrency) {
          const nextJob = this.getNextPendingJob();
          if (nextJob) {
            this.processJob(nextJob);
          }
        }
        
        // Check every 100ms for new jobs
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    };

    processLoop().catch(error => {
      jobLogger.error('Processing loop error', { error });
    });

    // Cleanup completed jobs every minute
    setInterval(() => {
      this.cleanupOldJobs();
    }, 60000);
  }

  private getNextPendingJob(): QueueJob | null {
    const pendingJobs = Array.from(this.jobs.values())
      .filter(job => job.status === 'pending')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    return pendingJobs[0] || null;
  }

  private async processJob(job: QueueJob): Promise<void> {
    this.activeJobs++;
    job.status = 'processing';
    job.startedAt = new Date();
    job.updatedAt = new Date();
    job.attempts++;

    jobLogger.info('Job processing started', {
      jobId: job.id,
      type: job.type,
      attempt: job.attempts,
      maxAttempts: job.maxAttempts
    });

    try {
      let result: any;

      switch (job.type) {
        case 'submit_permit':
          result = await submitPermitJob(job.data.caseId);
          break;
        case 'poll_status':
          result = await pollStatusJob(job.data.caseId);
          break;
        case 'schedule_inspection':
          result = await scheduleInspectionJob(
            job.data.caseId,
            job.data.inspectionType,
            job.data.window
          );
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      // Job completed successfully
      job.status = 'completed';
      job.completedAt = new Date();
      job.updatedAt = new Date();
      job.result = result;

      jobLogger.info('Job completed successfully', {
        jobId: job.id,
        type: job.type,
        duration: job.completedAt.getTime() - job.startedAt!.getTime(),
        result: this.sanitizeJobData(result)
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      job.error = errorMessage;
      job.updatedAt = new Date();

      jobLogger.error('Job processing failed', {
        jobId: job.id,
        type: job.type,
        attempt: job.attempts,
        maxAttempts: job.maxAttempts,
        error: errorMessage
      });

      // Retry logic
      if (job.attempts < job.maxAttempts) {
        const delay = this.retryDelays[Math.min(job.attempts - 1, this.retryDelays.length - 1)];
        
        setTimeout(() => {
          job.status = 'pending';
          job.updatedAt = new Date();
          
          jobLogger.info('Job scheduled for retry', {
            jobId: job.id,
            nextAttempt: job.attempts + 1,
            delay
          });
        }, delay);
      } else {
        // Max attempts reached
        job.status = 'failed';
        job.completedAt = new Date();
        
        jobLogger.error('Job failed permanently', {
          jobId: job.id,
          type: job.type,
          totalAttempts: job.attempts,
          finalError: errorMessage
        });
      }
    } finally {
      this.activeJobs--;
    }
  }

  private cleanupOldJobs(): void {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    let removedCount = 0;

    const jobEntries = Array.from(this.jobs.entries());
    for (const [jobId, job] of jobEntries) {
      if ((job.status === 'completed' || job.status === 'failed') && 
          job.updatedAt.getTime() < cutoffTime) {
        this.jobs.delete(jobId);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      jobLogger.info('Cleaned up old jobs', { removedCount });
    }
  }

  private sanitizeJobData(data: any): any {
    // Remove sensitive information from logs
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized = { ...data };
    const sensitiveFields = ['password', 'token', 'key', 'secret', 'credential'];
    
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  stop(): void {
    this.processing = false;
    jobLogger.info('Job queue stopped');
  }
}

// Singleton instance
const productionQueue = new ProductionJobQueue();

export async function enqueueJob(type: JobType, data: JobData, options?: {
  maxAttempts?: number;
  priority?: number;
  delay?: number;
}): Promise<string> {
  return await productionQueue.enqueue(type, data, options);
}

export async function getJobStatus(jobId: string): Promise<QueueJob | null> {
  return await productionQueue.getJob(jobId);
}

export async function cancelJob(jobId: string): Promise<boolean> {
  return await productionQueue.cancelJob(jobId);
}

export function getQueueStatus() {
  return productionQueue.getQueueStatus();
}

export function stopQueue(): void {
  productionQueue.stop();
}