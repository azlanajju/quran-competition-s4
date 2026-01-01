# Queue-Based Video Processing Setup Guide

This guide explains how to set up and run the asynchronous video processing system using BullMQ and Redis.

## Overview

The video processing system has been migrated from synchronous (blocking) to asynchronous (queue-based) processing. This provides:

- ✅ Fast user response (< 5 seconds)
- ✅ No request timeouts
- ✅ Better scalability
- ✅ Automatic retries
- ✅ Progress tracking

## Architecture

```
User Upload → API (saves to S3) → Queue (Redis) → Worker (FFmpeg) → S3 (HLS) → Database
```

## Prerequisites

1. **Redis Server** - Required for the job queue
2. **FFmpeg** - Already installed (for video processing)
3. **Node.js** - Already installed

## Installation Steps

### 1. Install Redis

#### Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### macOS:
```bash
brew install redis
brew services start redis
```

#### Windows:
- Download from https://redis.io/download
- Or use WSL (Windows Subsystem for Linux)
- Or use a cloud Redis service

#### Verify Redis is running:
```bash
redis-cli ping
# Should return: PONG
```

### 2. Configure Environment Variables

Add Redis configuration to your `.env` file:

```env
# Local Redis (default)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Or use Redis URL (for cloud Redis)
# REDIS_URL=redis://:password@host:port
```

### 3. Install Dependencies

Dependencies are already installed, but if needed:
```bash
npm install
```

## Running the System

### Development Mode

You need to run **two processes**:

#### Terminal 1: Next.js Application
```bash
npm run dev
```

#### Terminal 2: Video Processing Worker
```bash
npm run worker
```

### Production Mode

#### Option 1: Using PM2 (Recommended)

Install PM2:
```bash
npm install -g pm2
```

Start both processes:
```bash
# Start Next.js app
pm2 start npm --name "quran-app" -- start

# Start worker
pm2 start npm --name "video-worker" -- run worker

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

#### Option 2: Using systemd (Linux)

Create service files:

**`/etc/systemd/system/quran-app.service`:**
```ini
[Unit]
Description=Quran Competition Portal
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/quran-competition-portal
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
```

**`/etc/systemd/system/video-worker.service`:**
```ini
[Unit]
Description=Video Processing Worker
After=network.target redis.service

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/quran-competition-portal
ExecStart=/usr/bin/npm run worker
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable quran-app
sudo systemctl enable video-worker
sudo systemctl start quran-app
sudo systemctl start video-worker
```

## Monitoring

### Check Worker Status

The worker logs to console. You should see:
```
[Worker] Video processing worker is running. Press Ctrl+C to stop.
[Worker] Starting video processing for submission 123
[Worker] Job video-123 completed successfully
```

### Check Queue Status

You can use Redis CLI to check queue status:
```bash
redis-cli
> KEYS bull:video-processing:*
> LLEN bull:video-processing:wait
> LLEN bull:video-processing:active
```

### Check Processing Status via API

```bash
curl http://localhost:3000/api/video/status?submissionId=123
```

## Troubleshooting

### Worker Not Processing Jobs

1. **Check Redis connection:**
   ```bash
   redis-cli ping
   ```

2. **Check environment variables:**
   - Ensure `REDIS_HOST` and `REDIS_PORT` are correct
   - Or `REDIS_URL` is set correctly

3. **Check worker logs:**
   - Look for connection errors
   - Check for FFmpeg errors

### Jobs Stuck in Queue

1. **Check worker is running:**
   ```bash
   ps aux | grep worker
   ```

2. **Restart worker:**
   ```bash
   # If using PM2
   pm2 restart video-worker
   
   # If using systemd
   sudo systemctl restart video-worker
   ```

### High Memory Usage

- Reduce worker concurrency in `workers/video-processor.ts`:
  ```typescript
  concurrency: 1, // Process 1 video at a time instead of 2
  ```

### Redis Connection Errors

- Check Redis is running: `redis-cli ping`
- Check firewall settings
- Verify Redis host/port in `.env`

## Performance Tuning

### Worker Concurrency

Adjust in `workers/video-processor.ts`:
```typescript
concurrency: 2, // Number of videos to process simultaneously
```

**Recommendations:**
- **2-core VPS**: `concurrency: 1`
- **4-core VPS**: `concurrency: 2`
- **8+ core VPS**: `concurrency: 3-4`

### Queue Limits

Adjust in `workers/video-processor.ts`:
```typescript
limiter: {
  max: 5,      // Max jobs
  duration: 60000, // Per minute
}
```

## Cloud Redis (Optional)

For production, consider using a managed Redis service:

- **Redis Cloud**: https://redis.com/cloud/
- **AWS ElastiCache**: https://aws.amazon.com/elasticache/
- **DigitalOcean Managed Redis**: https://www.digitalocean.com/products/managed-databases

Update `.env`:
```env
REDIS_URL=redis://:password@your-redis-host:port
```

## Migration from Synchronous Processing

The system automatically handles the migration:
1. Old synchronous endpoint still works (but is deprecated)
2. New async endpoint is faster and more reliable
3. Frontend automatically uses the new system

## Support

If you encounter issues:
1. Check worker logs
2. Check Redis connection
3. Verify FFmpeg is installed
4. Check database connection
5. Review error messages in database (`processing_error` field)

