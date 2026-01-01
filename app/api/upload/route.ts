import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, fileType } = body;

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: 'File name and type are required' },
        { status: 400 }
      );
    }

    // Validate file type - allow both videos and ID card files (images/PDFs)
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const allowedDocumentTypes = ['application/pdf'];
    const allowedTypes = [...allowedVideoTypes, ...allowedImageTypes, ...allowedDocumentTypes];
    
    // Also check file extension as fallback
    const allowedExtensions = ['.mp4', '.webm', '.mov', '.avi', '.jpg', '.jpeg', '.png', '.pdf'];
    const fileExtension = '.' + (fileName.split('.').pop()?.toLowerCase() || '');
    const isValidExtension = allowedExtensions.includes(fileExtension);
    const isValidMimeType = allowedTypes.includes(fileType);
    
    if (!isValidMimeType && !isValidExtension) {
      return NextResponse.json(
        { 
          error: 'Invalid file type. Only video files, images (JPG, PNG), or PDF files are allowed.',
          details: `File type: ${fileType || 'unknown'}, Extension: ${fileExtension || 'none'}`
        },
        { status: 400 }
      );
    }

    // Generate unique file key based on file type
    let fileExtensionForKey = fileName.split('.').pop()?.toLowerCase() || 'bin';
    
    // Determine folder based on file type
    let folder = 'student-files';
    if (allowedVideoTypes.includes(fileType) || ['.mp4', '.webm', '.mov', '.avi'].includes(fileExtension)) {
      folder = 'student-videos';
      fileExtensionForKey = fileType.includes('mp4') ? 'mp4' : fileExtensionForKey;
    } else if (allowedImageTypes.includes(fileType) || ['.jpg', '.jpeg', '.png'].includes(fileExtension)) {
      folder = 'student-id-cards';
    } else if (allowedDocumentTypes.includes(fileType) || fileExtension === '.pdf') {
      folder = 'student-id-cards';
      fileExtensionForKey = 'pdf';
    }
    
    const fileKey = `${folder}/${uuidv4()}.${fileExtensionForKey}`;

    // Create S3 PutObject command
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      ContentType: fileType,
      // Add metadata for tracking
      Metadata: {
        'original-name': fileName,
        'upload-date': new Date().toISOString(),
      },
    });

    // Generate presigned URL (valid for 1 hour)
    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour
    });

    return NextResponse.json({
      uploadUrl,
      fileKey,
      bucket: BUCKET_NAME,
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}

