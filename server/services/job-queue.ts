import { submitPermitJob, pollStatusJob, scheduleInspectionJob } from "../workers/permit-jobs";

interface JobData {
  [key: string]: any;
}

type JobType = "submit_permit" | "poll_status" | "schedule_inspection";

// Simple in-memory job queue for demo purposes
// In production, this would use Redis + BullMQ
class JobQueue {
  private queue: Array<{ type: JobType; data: JobData; id: string; createdAt: Date }> = [];
  private processing = false;

  async enqueue(type: JobType, data: JobData): Promise<string> {
    const jobId = crypto.randomUUID();
    const job = {
      id: jobId,
      type,
      data,
      createdAt: new Date()
    };
    
    this.queue.push(job);
    console.log(`📋 Enqueued job ${type} with ID: ${jobId}`);
    
    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }
    
    return jobId;
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    
    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) continue;

      try {
        console.log(`🔄 Processing job ${job.type} (${job.id})`);
        
        switch (job.type) {
          case "submit_permit":
            await submitPermitJob(job.data.caseId);
            break;
          case "poll_status":
            await pollStatusJob(job.data.caseId);
            break;
          case "schedule_inspection":
            await scheduleInspectionJob(
              job.data.caseId,
              job.data.inspectionType,
              job.data.window
            );
            break;
          default:
            console.warn(`Unknown job type: ${job.type}`);
        }
        
        console.log(`✅ Completed job ${job.type} (${job.id})`);
      } catch (error) {
        console.error(`❌ Failed job ${job.type} (${job.id}):`, error);
      }

      // Add delay between jobs to simulate realistic processing
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    this.processing = false;
  }

  getQueueStatus() {
    return {
      pending: this.queue.length,
      processing: this.processing
    };
  }
}

const jobQueue = new JobQueue();

export async function enqueuJob(type: JobType, data: JobData): Promise<string> {
  return await jobQueue.enqueue(type, data);
}

export function getQueueStatus() {
  return jobQueue.getQueueStatus();
}

// Auto-start status polling for submitted cases
export async function startStatusPolling(): Promise<void> {
  setInterval(async () => {
    try {
      // This would query for cases in "submitted" status and poll them
      // For demo purposes, we'll skip automatic polling
      console.log("🔄 Status polling check (disabled for demo)");
    } catch (error) {
      console.error("Status polling error:", error);
    }
  }, 5 * 60 * 1000); // Every 5 minutes
}
