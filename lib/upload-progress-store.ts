// Shared upload progress store
// In production, use Redis or a database for persistence across server instances

interface UploadProgress {
  uploaded: number;
  total: number;
  percentage: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

class UploadProgressStore {
  private progress = new Map<string, UploadProgress>();

  set(uploadId: string, data: UploadProgress) {
    this.progress.set(uploadId, data);
  }

  get(uploadId: string): UploadProgress | undefined {
    return this.progress.get(uploadId);
  }

  delete(uploadId: string) {
    this.progress.delete(uploadId);
  }

  // Clean up old entries (older than 10 minutes)
  cleanup() {
    // In a real implementation, you'd track timestamps
    // For now, we'll rely on manual cleanup
  }
}

export const uploadProgressStore = new UploadProgressStore();

