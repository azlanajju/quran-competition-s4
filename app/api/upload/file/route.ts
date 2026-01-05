import { NextRequest, NextResponse } from 'next/server';
import { uploadBufferToS3 } from '@/lib/s3-upload';
import { v4 as uuidv4 } from 'uuid';

// Configure route to handle large file uploads
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for large file uploads

export async function POST(request: NextRequest) {
  try {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error: any) {
      // Handle body size limit errors (413)
      if (error.message?.includes('413') || error.message?.includes('too large') || error.message?.includes('PayloadTooLargeError')) {
        return NextResponse.json(
          { 
            error: 'File size exceeds server limit',
            details: 'The file you are trying to upload is too large. Please check your server configuration (nginx client_max_body_size, hosting platform limits, etc.)',
            code: 'PAYLOAD_TOO_LARGE'
          },
          { status: 413 }
        );
      }
      throw error;
    }
    
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    // Validate file type - allow both videos and ID card files
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const allowedDocumentTypes = ['application/pdf'];
    const allowedTypes = [...allowedVideoTypes, ...allowedImageTypes, ...allowedDocumentTypes];
    
    // Also check file extension as fallback
    const allowedExtensions = ['.mp4', '.webm', '.mov', '.avi', '.jpg', '.jpeg', '.png', '.pdf'];
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.includes('.') ? '.' + fileName.split('.').pop() : '';
    const isValidExtension = fileExtension && allowedExtensions.includes(fileExtension);
    const isValidMimeType = !file.type || allowedTypes.includes(file.type);
    
    if (!isValidMimeType && !isValidExtension) {
      return NextResponse.json(
        { 
          error: 'Invalid file type. Only video files, images (JPG, PNG), or PDF files are allowed.',
          details: `File type: ${file.type || 'unknown'}, Extension: ${fileExtension || 'none'}`
        },
        { status: 400 }
      );
    }

    // Validate file size (100MB max for videos, 5MB for images/PDFs)
    const maxVideoSize = 100 * 1024 * 1024; // 100MB
    const maxImageSize = 5 * 1024 * 1024; // 5MB
    const isVideo = allowedVideoTypes.includes(file.type) || ['.mp4', '.webm', '.mov', '.avi'].includes(fileExtension);
    const maxSize = isVideo ? maxVideoSize : maxImageSize;

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds ${(maxSize / (1024 * 1024)).toFixed(0)}MB limit` },
        { status: 400 }
      );
    }

    // Determine folder and file extension
    let folder = 'student-files';
    let fileExtensionForKey = fileName.split('.').pop()?.toLowerCase() || 'bin';
    
    if (allowedVideoTypes.includes(file.type) || ['.mp4', '.webm', '.mov', '.avi'].includes(fileExtension)) {
      folder = 'student-videos';
      fileExtensionForKey = file.type?.includes('mp4') ? 'mp4' : fileExtensionForKey;
    } else if (allowedImageTypes.includes(file.type) || ['.jpg', '.jpeg', '.png'].includes(fileExtension)) {
      folder = 'student-id-cards';
      if (fileExtension === '.jpg' || fileExtension === '.jpeg') {
        fileExtensionForKey = 'jpeg';
      } else if (fileExtension === '.png') {
        fileExtensionForKey = 'png';
      }
    } else if (allowedDocumentTypes.includes(file.type) || fileExtension === '.pdf') {
      folder = 'student-id-cards';
      fileExtensionForKey = 'pdf';
    }

    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine content type
    let contentType = file.type || 'application/octet-stream';
    if (!contentType || contentType === 'application/octet-stream') {
      if (fileExtension === '.jpg' || fileExtension === '.jpeg') {
        contentType = 'image/jpeg';
      } else if (fileExtension === '.png') {
        contentType = 'image/png';
      } else if (fileExtension === '.pdf') {
        contentType = 'application/pdf';
      } else if (fileExtension === '.mp4') {
        contentType = 'video/mp4';
      }
    }

    // Validate AWS credentials
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET_NAME) {
      console.error('AWS credentials missing:', {
        hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
        hasBucket: !!process.env.AWS_S3_BUCKET_NAME,
      });
      return NextResponse.json(
        { error: 'AWS S3 configuration is missing. Please check your environment variables.' },
        { status: 500 }
      );
    }

    // Upload to S3
    const fileKey = `${folder}/${uuidv4()}.${fileExtensionForKey}`;
    
    try {
      const result = await uploadBufferToS3(
        buffer,
        fileKey,
        contentType,
        {
          'original-name': file.name,
          'upload-date': new Date().toISOString(),
        }
      );

      return NextResponse.json({
        success: true,
        fileKey: result.key,
        fileUrl: result.url,
        fileName: file.name,
        fileSize: file.size,
      });
    } catch (s3Error: any) {
      console.error('S3 upload error:', {
        message: s3Error.message,
        code: s3Error.Code || s3Error.code,
        name: s3Error.name,
        stack: s3Error.stack,
      });
      throw s3Error;
    }
  } catch (error: any) {
    console.error('File upload error:', {
      message: error.message,
      name: error.name,
      code: error.Code || error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to upload file',
        details: error.message,
        code: error.Code || error.code || 'UNKNOWN_ERROR',
      },
      { status: 500 }
    );
  }
}

