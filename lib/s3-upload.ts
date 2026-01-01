import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { promises as fs } from 'fs';
import path from 'path';
import { Readable } from 'stream';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

export interface UploadResult {
  key: string;
  url: string;
}

/**
 * Upload file to S3
 */
export async function uploadFileToS3(
  filePath: string,
  s3Key: string,
  contentType: string,
  metadata?: Record<string, string>
): Promise<UploadResult> {
  const fileContent = await fs.readFile(filePath);

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    Body: fileContent,
    ContentType: contentType,
    Metadata: metadata,
  });

  await s3Client.send(command);

  return {
    key: s3Key,
    url: `s3://${BUCKET_NAME}/${s3Key}`,
  };
}

/**
 * Upload buffer to S3
 */
export async function uploadBufferToS3(
  buffer: Buffer,
  s3Key: string,
  contentType: string,
  metadata?: Record<string, string>
): Promise<UploadResult> {
  if (!BUCKET_NAME) {
    throw new Error('AWS_S3_BUCKET_NAME environment variable is not set');
  }

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS credentials are not set');
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    Body: buffer,
    ContentType: contentType,
    Metadata: metadata,
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

/**
 * Upload directory contents to S3
 */
export async function uploadDirectoryToS3(
  dirPath: string,
  s3BaseKey: string
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  const files = await fs.readdir(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = await fs.stat(filePath);

    if (stat.isFile()) {
      const s3Key = `${s3BaseKey}/${file}`;
      let contentType = 'application/octet-stream';

      if (file.endsWith('.m3u8')) {
        contentType = 'application/vnd.apple.mpegurl';
      } else if (file.endsWith('.ts')) {
        contentType = 'video/mp2t';
      } else if (file.endsWith('.mp4')) {
        contentType = 'video/mp4';
      } else if (file.endsWith('.jpg') || file.endsWith('.jpeg')) {
        contentType = 'image/jpeg';
      } else if (file.endsWith('.png')) {
        contentType = 'image/png';
      } else if (file.endsWith('.pdf')) {
        contentType = 'application/pdf';
      }

      const result = await uploadFileToS3(filePath, s3Key, contentType);
      results.push(result);
    }
  }

  return results;
}

/**
 * Generate signed URL for private S3 object
 */
export async function getSignedUrlForS3(
  s3Key: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Generate presigned URL for upload
 */
export async function getPresignedUploadUrl(
  s3Key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  const { PutObjectCommand } = await import('@aws-sdk/client-s3');
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    ContentType: contentType,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

