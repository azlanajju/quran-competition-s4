# Direct S3 Upload Implementation Proposal

## Current Flow (Browser → Server → S3)
```
Browser uploads to Next.js Server (0-90%)
  ↓
Server validates & streams to S3 (90-100%)
  ↓
Server creates database record
  ↓
Returns success
```

**Problems:**
- Double upload (slower)
- Progress stuck at 90% while server uploads to S3
- Server handles large file data (memory/bandwidth)

## Proposed Flow (Browser → S3 Direct)
```
1. Browser requests presigned URL from server
   ↓
2. Server validates studentId, generates S3 key, returns presigned URL
   ↓
3. Browser uploads directly to S3 (0-100% real progress)
   ↓
4. Browser notifies server when upload completes
   ↓
5. Server creates database record
```

**Benefits:**
- Single upload (faster)
- Real progress tracking (0-100%)
- No server bandwidth used for file data
- Still secure (server validates before presigned URL)

## Implementation Steps

### 1. Create API endpoint to generate presigned URL
`/api/video/presigned-upload-url`
- Validates studentId exists
- Generates unique S3 key
- Returns presigned URL

### 2. Update frontend to use direct S3 upload
- Request presigned URL first
- Upload directly to S3 using presigned URL
- Track real progress (0-100%)
- Notify server when complete

### 3. Create callback endpoint
`/api/video/upload-complete`
- Verifies upload succeeded in S3
- Creates database record
- Returns submissionId

## Code Already Available
- `getPresignedUploadUrl()` exists in `lib/s3-upload.ts` (line 152)
- Just needs to be integrated into the upload flow

