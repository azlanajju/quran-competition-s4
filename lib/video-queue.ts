import { Queue } from "bullmq";
import { getRedisClient } from "./redis";

// Video processing job data interface
export interface VideoProcessingJobData {
  submissionId: number;
  studentId: number;
  originalVideoKey: string; // S3 key of the original video
  originalVideoPath?: string; // Temporary local path (if needed)
}

// Create video processing queue
export const videoProcessingQueue = new Queue<VideoProcessingJobData>("video-processing", {
  connection: getRedisClient(),
  defaultJobOptions: {
    attempts: 3, // Retry up to 3 times
    backoff: {
      type: "exponential",
      delay: 5000, // Start with 5 second delay, then exponential backoff
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000, // Keep last 1000 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
});

// Helper function to add a video processing job
export async function addVideoProcessingJob(data: VideoProcessingJobData) {
  const job = await videoProcessingQueue.add("process-video", data, {
    jobId: `video-${data.submissionId}`, // Unique job ID
    priority: 0, // Can be adjusted for priority processing
  });

  console.log(`Video processing job added: ${job.id} for submission ${data.submissionId}`);
  return job;
}

// Get job status
export async function getJobStatus(jobId: string) {
  const job = await videoProcessingQueue.getJob(jobId);
  if (!job) {
    return null;
  }

  const state = await job.getState();
  const progress = job.progress || 0;
  const failedReason = job.failedReason || null;

  return {
    id: job.id,
    state,
    progress,
    failedReason,
    data: job.data,
    timestamp: job.timestamp,
  };
}

