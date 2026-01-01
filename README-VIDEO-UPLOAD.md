# Video Upload & Processing System

This document describes the video upload and processing system implementation.

## Overview

The system allows registered users to upload videos that are:
1. Processed to 360p resolution using FFmpeg
2. Converted to HLS format (.m3u8 + .ts segments)
3. Stored in a private Amazon S3 bucket
4. Associated with user registrations in MySQL database

## Prerequisites

### 1. FFmpeg Installation

FFmpeg must be installed on your VPS/server:

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
Download from https://ffmpeg.org/download.html and add to PATH

**Verify installation:**
```bash
ffmpeg -version
```

### 2. MySQL Database

Create the database and tables:

**Option 1: Using the API endpoint**
```bash
POST /api/db/init
```

**Option 2: Manual SQL execution**
```bash
mysql -u root -p < database/schema.sql
```

### 3. Environment Variables

Copy `env.example` to `.env` and configure:

```env
# AWS S3 (already configured)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET_NAME=your_bucket_name

# MySQL Database
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=quran_competition
DATABASE_USER=root
DATABASE_PASSWORD=your_password
```

## API Endpoints

### 1. User Registration
**POST** `/api/student/register`

Registers a new student and stores data in MySQL.

**Request Body:**
```json
{
  "fullName": "John Doe",
  "phone": "+1234567890",
  "dateOfBirth": "2010-01-15",
  "address": "123 Main St",
  "city": "Mangalore",
  "state": "Karnataka",
  "zipCode": "575001",
  "idCardKey": "students/123/id-card.pdf",
  "idCardUrl": "s3://bucket/students/123/id-card.pdf"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "studentId": 1
}
```

### 2. Video Upload & Processing
**POST** `/api/video/upload-process`

Uploads and processes a video file.

**Request:** `multipart/form-data`
- `video`: Video file (max 100MB)
- `studentId`: Student ID from registration

**Response:**
```json
{
  "success": true,
  "message": "Video processed and uploaded successfully",
  "submissionId": 1,
  "originalVideoKey": "students/1/original/video.mp4",
  "hlsMasterPlaylistKey": "students/1/hls/uuid/master.m3u8",
  "hlsSegmentCount": 15
}
```

### 3. Get Signed URL for Playback
**GET** `/api/video/signed-url?submissionId=1&type=hls`

Generates a signed URL for secure video playback.

**Query Parameters:**
- `submissionId`: Video submission ID (optional)
- `studentId`: Student ID (optional, gets latest submission)
- `type`: `hls` or `original` (default: `hls`)
- `expiresIn`: URL expiration in seconds (default: 3600)

**Response:**
```json
{
  "success": true,
  "signedUrl": "https://s3.amazonaws.com/...",
  "s3Key": "students/1/hls/uuid/master.m3u8",
  "type": "hls",
  "expiresIn": 3600
}
```

### 4. Database Initialization
**POST** `/api/db/init`

Initializes database schema (creates tables if they don't exist).

**GET** `/api/db/init`

Tests database connection.

## Video Processing Details

### Processing Pipeline

1. **Upload**: Video file received via multipart form data
2. **Validation**: File type and size validation
3. **Temporary Storage**: File saved to temp directory
4. **FFmpeg Processing**:
   - Resolution: 360p (640x360)
   - Codec: H.264 (libx264)
   - Audio: AAC (128kbps)
   - Format: HLS (.m3u8 + .ts segments)
   - Segment duration: 10 seconds
5. **S3 Upload**: 
   - Original video uploaded to `students/{studentId}/original/`
   - HLS files uploaded to `students/{studentId}/hls/{uuid}/`
6. **Database Storage**: Submission record created with S3 keys
7. **Cleanup**: Temporary files deleted

### S3 Structure

```
bucket/
 GET /student/register 200 in 70ms (compile: 36ms, render: 35ms)
File upload error: AccessDenied: User: arn:aws:iam::637703784751:user/qirat-storage-user is not authorized to perform: s3:PutObject on resource: "arn:aws:s3:::qirat-media-bucket/student-id-cards/957b7ffc-6bbf-47cd-94a2-72b38fe12dc0.jpeg" because no identity-based policy allows the s3:PutObject action
    at async uploadBufferToS3 (lib\s3-upload.ts:66:3)
    at async POST (app\api\upload\file\route.ts:92:20)
  64 |   });
  65 |
> 66 |   await s3Client.send(command);
     |   ^
  67 |
  68 |   return {
  69 |     key: s3Key, {
  '$fault': 'client',
  '$retryable': undefined,
  '$metadata': [Object],
  Code: 'AccessDenied',
  RequestId: 'P24N5Z8H88H0RED0',
  HostId: 'UwfkQWJiA2+4DWu7KVHzLHMMjsw5xYQZAZn4rjiy+ebrsH7pfU4Y1eW2ERjWexHjSi+oHcPyEIhoSd7JAz7p5U+MLqfqygXO'
}
 POST /api/upload/file 500 in 2.3s (compile: 757ms, render: 1502ms)
 GET /student/register 200 in 59ms (compile: 34ms, render: 24ms)
 GET /student/register 200 in 84ms (compile: 38ms, render: 46ms)
 GET /student/register 200 in 81ms (compile: 43ms, render: 38ms)
S3 PutObjectCommand error: {
  message: 'User: arn:aws:iam::637703784751:user/qirat-storage-user is not authorized to perform: s3:PutObject on resource: "arn:aws:s3:::qirat-media-bucket/student-id-cards/081b4bbd-c420-423a-a4cb-3e4af981c603.jpeg" because no identity-based policy allows the s3:PutObject action',
  code: 'AccessDenied',
  name: 'AccessDenied',
  bucket: 'qirat-media-bucket',
  key: 'student-id-cards/081b4bbd-c420-423a-a4cb-3e4af981c603.jpeg',
  region: 'eu-north-1'
}
S3 upload error: {
  message: 'User: arn:aws:iam::637703784751:user/qirat-storage-user is not authorized to perform: s3:PutObject on resource: "arn:aws:s3:::qirat-media-bucket/student-id-cards/081b4bbd-c420-423a-a4cb-3e4af981c603.jpeg" because no identity-based policy allows the s3:PutObject action',
  code: 'AccessDenied',
  name: 'AccessDenied',
  stack: 'AccessDenied: User: arn:aws:iam::637703784751:user/qirat-storage-user is not authorized to perform: s3:PutObject on resource: "arn:aws:s3:::qirat-media-bucket/student-id-cards/081b4bbd-c420-423a-a4cb-3e4af981c603.jpeg" because no identity-based policy allows the s3:PutObject action\n' +
    '    at ProtocolLib.getErrorSchemaOrThrowBaseException (C:\\Users\\Thammi\\Desktop\\Projects and websites\\Quran portal\\quran-competition-portal\\node_modules\\@aws-sdk\\core\\dist-cjs\\submodules\\protocols\\index.js:69:67)\n' +
    '    at AwsRestXmlProtocol.handleError (C:\\Users\\Thammi\\Desktop\\Projects and websites\\Quran portal\\quran-competition-portal\\node_modules\\@aws-sdk\\core\\dist-cjs\\submodules\\protocols\\index.js:1795:65)\n' +
    '    at AwsRestXmlProtocol.deserializeResponse (C:\\Users\\Thammi\\Desktop\\Projects and websites\\Quran portal\\quran-competition-portal\\node_modules\\@smithy\\core\\dist-cjs\\submodules\\protocols\\index.js:301:24)\n' +
    '    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n' +
    '    at async C:\\Users\\Thammi\\Desktop\\Projects and websites\\Quran portal\\quran-competition-portal\\node_modules\\@smithy\\core\\dist-cjs\\submodules\\schema\\index.js:26:24\n' +
    '    at async C:\\Users\\Thammi\\Desktop\\Projects and websites\\Quran portal\\quran-competition-portal\\node_modules\\@aws-sdk\\middleware-sdk-s3\\dist-cjs\\index.js:386:20\n' +
    '    at async C:\\Users\\Thammi\\Desktop\\Projects and websites\\Quran portal\\quran-competition-portal\\node_modules\\@smithy\\middleware-retry\\dist-cjs\\index.js:254:46\n' +
    '    at async C:\\Users\\Thammi\\Desktop\\Projects and websites\\Quran portal\\quran-competition-portal\\node_modules\\@aws-sdk\\middleware-flexible-checksums\\dist-cjs\\index.js:241:24\n' +
    '    at async C:\\Users\\Thammi\\Desktop\\Projects and websites\\Quran portal\\quran-competition-portal\\node_modules\\@aws-sdk\\middleware-sdk-s3\\dist-cjs\\index.js:63:28\n' +
    '    at async C:\\Users\\Thammi\\Desktop\\Projects and websites\\Quran portal\\quran-competition-portal\\node_modules\\@aws-sdk\\middleware-sdk-s3\\dist-cjs\\index.js:90:20\n' +
    '    at async C:\\Users\\Thammi\\Desktop\\Projects and websites\\Quran portal\\quran-competition-portal\\node_modules\\@aws-sdk\\middleware-logger\\dist-cjs\\index.js:5:26\n' +
    '    at async uploadBufferToS3 (webpack-internal:///(rsc)/./lib/s3-upload.ts:62:9)\n' +
    '    at async POST (webpack-internal:///(rsc)/./app/api/upload/file/route.ts:140:28)\n' +
    '    at async AppRouteRouteModule.do (C:\\Users\\Thammi\\Desktop\\Projects and websites\\Quran portal\\quran-competition-portal\\node_modules\\next\\dist\\compiled\\next-server\\app-route.runtime.dev.js:5:37866)\n' +
    '    at async AppRouteRouteModule.handle (C:\\Users\\Thammi\\Desktop\\Projects and websites\\Quran portal\\quran-competition-portal\\node_modules\\next\\dist\\compiled\\next-server\\app-route.runtime.dev.js:5:45156)\n' +
    '    at async responseGenerator (webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fupload%2Ffile%2Froute&page=%2Fapi%2Fupload%2Ffile%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fupload%2Ffile%2Froute.ts&appDir=C%3A%5CUsers%5CThammi%5CDesktop%5CProjects%20and%20websites%5CQuran%20portal%5Cquran-competition-portal%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CThammi%5CDesktop%5CProjects%20and%20websites%5CQuran%20portal%5Cquran-competition-portal&isDev=true&tsconfigPath=&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D&isGlobalNotFoundEnabled=!:230:38)\n' +
    '    at async AppRouteRouteModule.handleResponse (C:\\Users\\Thammi\\Desktop\\Projects and websites\\Quran portal\\quran-competition-portal\\node_modules\\next\\dist\\compiled\\next-server\\app-route.runtime.dev.js:1:187638)\n' +
    '    at async handleResponse (webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fupload%2Ffile%2Froute&page=%2Fapi%2Fupload%2Ffile%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fupload%2Ffile%2Froute.ts&appDir=C%3A%5CUsers%5CThammi%5CDesktop%5CProjects%20and%20websites%5CQuran%20portal%5Cquran-competition-portal%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CThammi%5CDesktop%5CProjects%20and%20websites%5CQuran%20portal%5Cquran-competition-portal&isDev=true&tsconfigPath=&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D&isGlobalNotFoundEnabled=!:293:32)\n' +
    '    at async Module.handler (webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fupload%2Ffile%2Froute&page=%2Fapi%2Fupload%2Ffile%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fupload%2Ffile%2Froute.ts&appDir=C%3A%5CUsers%5CThammi%5CDesktop%5CProjects%20and%20websites%5CQuran%20portal%5Cquran-competition-portal%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CThammi%5CDesktop%5CProjects%20and%20websites%5CQuran%20portal%5Cquran-competition-portal&isDev=true&tsconfigPath=&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D&isGlobalNotFoundEnabled=!:347:13)\n' +
    '    at async DevServer.renderToResponseWithComponentsImpl (C:\\Users\\Thammi\\Desktop\\Projects and websites\\Quran portal\\quran-competition-portal\\node_modules\\next\\dist\\server\\base-server.js:1422:9)\n' +
    '    at async DevServer.renderPageComponent (C:\\Users\\Thammi\\Desktop\\Projects and websites\\Quran portal\\quran-competition-portal\\node_modules\\next\\dist\\server\\base-server.js:1474:24)\n' +      
├── students/
│   ├── {studentId}/
│   │   ├── original/
│   │   │   └── {uuid}.mp4
│   │   └── hls/
│   │       └── {uuid}/
│   │           ├── master.m3u8
│   │           ├── segment_000.ts
│   │           ├── segment_001.ts
│   │           └── ...
```

## Frontend Integration

### Update Registration Flow

The registration page should:

1. Upload ID card first (existing flow)
2. Register student (get `studentId`)
3. Upload and process video with `studentId`

**Example:**
```typescript
// After registration
const registrationResponse = await fetch('/api/student/register', {
  method: 'POST',
  body: JSON.stringify(formData),
});
const { studentId } = await registrationResponse.json();

// Upload video
const videoFormData = new FormData();
videoFormData.append('video', videoFile);
videoFormData.append('studentId', studentId);

const videoResponse = await fetch('/api/video/upload-process', {
  method: 'POST',
  body: videoFormData,
});
```

### Video Playback

For HLS playback, use a player that supports HLS:

```typescript
// Get signed URL
const urlResponse = await fetch(
  `/api/video/signed-url?submissionId=${submissionId}&type=hls`
);
const { signedUrl } = await urlResponse.json();

// Use with HLS.js or video.js
import Hls from 'hls.js';
const video = document.getElementById('video');
const hls = new Hls();
hls.loadSource(signedUrl);
hls.attachMedia(video);
```

## Security Considerations

1. **Private S3 Bucket**: All videos stored in private bucket
2. **Signed URLs**: Temporary access via presigned URLs
3. **Server-Side Processing**: FFmpeg runs on server, not client
4. **File Validation**: Type and size validation before processing
5. **Database Constraints**: Foreign keys ensure data integrity

## Troubleshooting

### FFmpeg Not Found
- Ensure FFmpeg is installed and in PATH
- Check with: `which ffmpeg` or `ffmpeg -version`

### Database Connection Failed
- Verify MySQL credentials in `.env`
- Ensure MySQL server is running
- Check firewall/network settings

### Video Processing Fails
- Check server disk space (temp files)
- Verify video file format is supported
- Check FFmpeg logs in console

### S3 Upload Fails
- Verify AWS credentials
- Check bucket permissions
- Ensure bucket exists and is accessible

## Performance Notes

- Video processing is CPU-intensive
- Consider using a queue system (e.g., Bull, BullMQ) for production
- Monitor server resources during processing
- Large files may take several minutes to process

