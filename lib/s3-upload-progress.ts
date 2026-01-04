import { Readable, Transform } from 'stream';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

/**
 * Creates a progress-tracking transform stream for S3 uploads
 */
export class ProgressTrackingStream extends Transform {
  private totalSize: number;
  private uploaded: number = 0;
  private onProgress?: (uploaded: number, total: number, percentage: number) => void;

  constructor(
    totalSize: number,
    onProgress?: (uploaded: number, total: number, percentage: number) => void
  ) {
    super();
    this.totalSize = totalSize;
    this.onProgress = onProgress;
  }

  _transform(chunk: Buffer, encoding: string, callback: () => void) {
    this.uploaded += chunk.length;
    if (this.onProgress) {
      const percentage = Math.min(100, (this.uploaded / this.totalSize) * 100);
      this.onProgress(this.uploaded, this.totalSize, percentage);
    }
    this.push(chunk);
    callback();
  }
}

/**
 * Upload stream to S3 with progress tracking
 */
export async function uploadBufferToS3WithProgress(
  sourceStream: Readable,
  s3Key: string,
  contentType: string,
  totalSize: number,
  onProgress: (uploaded: number, total: number, percentage: number) => void
): Promise<{ key: string; url: string }> {
  const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

  if (!BUCKET_NAME) {
    throw new Error('AWS_S3_BUCKET_NAME environment variable is not set');
  }

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS credentials are not set');
  }

  // Create a transform stream that tracks progress
  const progressStream = new ProgressTrackingStream(totalSize, onProgress);
  
  // Pipe source stream through progress tracker
  sourceStream.pipe(progressStream);

  const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    Body: progressStream,
    ContentType: contentType,
    ContentLength: totalSize,
  });

  try {
    await s3Client.send(command);
  } catch (error: any) {
    console.error('S3 PutObjectCommand error:', {
      message: error.message,
      code: error.Code || error.code,
      name: error.name,
      bucket: BUCKET_NAME,
      key: s3Key,
      region: process.env.AWS_REGION,
    });
    throw error;
  }

  return {
    key: s3Key,
    url: `s3://${BUCKET_NAME}/${s3Key}`,
  };
}

