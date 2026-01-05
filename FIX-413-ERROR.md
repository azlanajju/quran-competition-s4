# Fixing 413 Payload Too Large Error

## Problem
You're receiving a 413 status code when uploading files during registration. This error means the request body size exceeds the server's configured limit.

## Common Causes

The 413 error typically comes from one of these sources:

1. **Nginx Reverse Proxy** (most common)
2. **Hosting Platform Limits** (Vercel, AWS, etc.)
3. **Next.js Server Configuration**

## Solutions

### 1. If Using Nginx as Reverse Proxy

Add or update the `client_max_body_size` directive in your nginx configuration:

```nginx
server {
    # ... other config ...
    
    # Increase body size limit (e.g., 100MB for ID cards, 500MB for videos)
    client_max_body_size 500M;
    
    # Also increase buffer sizes
    client_body_buffer_size 128k;
    
    # ... rest of config ...
}
```

After updating, restart nginx:
```bash
sudo nginx -t  # Test configuration
sudo systemctl reload nginx  # Reload nginx
```

### 2. If Using Apache

Add to your `.htaccess` or Apache config:

```apache
php_value upload_max_filesize 500M
php_value post_max_size 500M
```

### 3. If Using Vercel

Vercel has a default limit of 4.5MB for serverless functions. For larger uploads, you need to:
- Use direct S3 uploads (which you're already doing for videos)
- Or upgrade to a plan that supports larger payloads
- Or use Vercel Blob Storage

### 4. If Using Other Hosting Platforms

Check your hosting platform's documentation for:
- Request body size limits
- File upload size limits
- How to increase these limits

### 5. Check Your Server Logs

Look for specific error messages that indicate where the limit is being enforced:
- Nginx error logs: `/var/log/nginx/error.log`
- Application logs
- Hosting platform logs

## Current Application Configuration

The application is configured to handle:
- **ID Card files**: Up to 5MB
- **Video files**: Up to 500MB (uploaded directly to S3)

The 413 error is likely happening when uploading the ID card file (5MB) to `/api/upload/file`.

## Recommended Solution

Since you're already using direct S3 uploads for videos, consider also using presigned URLs for ID card uploads to bypass server body size limits entirely. This would require:

1. Creating a presigned URL endpoint for ID card uploads
2. Uploading ID cards directly to S3 (similar to video uploads)
3. This eliminates the need for large body size limits on your server

## Testing

After making changes, test with:
1. A small file (< 1MB) - should work
2. A medium file (2-5MB) - should work if limits are properly configured
3. Check server logs for any remaining errors

