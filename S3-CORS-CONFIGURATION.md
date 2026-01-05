# S3 CORS Configuration for Direct Upload

## Problem
When uploading directly to S3 from the browser, you get a CORS error:
```
Access to XMLHttpRequest at 'https://...s3.amazonaws.com/...' from origin 'http://localhost:3000' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

## Solution
Configure CORS on your S3 bucket to allow browser uploads.

## S3 Bucket CORS Configuration

### Step 1: Go to AWS S3 Console
1. Open AWS S3 Console
2. Select your bucket: `qirat-media-bucket`
3. Go to **Permissions** tab
4. Scroll down to **Cross-origin resource sharing (CORS)**
5. Click **Edit**

### Step 2: Add CORS Configuration

Paste this JSON configuration:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "HEAD"
        ],
        "AllowedOrigins": [
            "http://localhost:3000",
            "https://your-production-domain.com"
        ],
        "ExposeHeaders": [
            "ETag",
            "x-amz-request-id"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

### Step 3: Update for Production

Replace `https://your-production-domain.com` with your actual production domain.

For example:
- `https://quran-competition.com`
- `https://www.quran-competition.com`

### Step 4: Save Configuration

Click **Save changes**

## Alternative: Using AWS CLI

If you prefer using AWS CLI:

```bash
aws s3api put-bucket-cors --bucket qirat-media-bucket --cors-configuration file://cors-config.json
```

Create `cors-config.json`:
```json
{
    "CORSRules": [
        {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
            "AllowedOrigins": [
                "http://localhost:3000",
                "https://your-production-domain.com"
            ],
            "ExposeHeaders": ["ETag", "x-amz-request-id"],
            "MaxAgeSeconds": 3000
        }
    ]
}
```

## Testing

After configuring CORS:
1. Clear browser cache
2. Try uploading again
3. The CORS error should be gone

## Security Note

- `AllowedOrigins` should only include your actual domains
- Don't use `"*"` for `AllowedOrigins` in production (security risk)
- `AllowedHeaders: ["*"]` is fine for presigned URLs

## Troubleshooting

If CORS still doesn't work:
1. Check bucket name matches exactly
2. Verify CORS config was saved
3. Clear browser cache
4. Check browser console for specific CORS error
5. Verify the origin URL matches exactly (including http/https, port, etc.)

