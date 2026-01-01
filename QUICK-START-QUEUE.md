# Quick Start: Queue-Based Video Processing

## What Changed?

Your video processing system now uses **asynchronous queue-based processing** instead of synchronous processing. This means:

- ✅ **Fast uploads**: Users get response in < 5 seconds
- ✅ **No timeouts**: Processing happens in background
- ✅ **Better scalability**: Can handle multiple concurrent uploads
- ✅ **Automatic retries**: Failed jobs retry automatically

## Quick Setup (3 Steps)

### Step 1: Install Redis

**Ubuntu/Debian:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis-server
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Windows:**
- Use WSL or a cloud Redis service

**Verify:**
```bash
redis-cli ping
# Should return: PONG
```

### Step 2: Configure Environment

Add to your `.env` file:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### Step 3: Start the System

**Development (2 terminals):**

Terminal 1 - Next.js app:
```bash
npm run dev
```

Terminal 2 - Worker:
```bash
npm run worker
```

**Production (using PM2):**
```bash
npm install -g pm2
pm2 start npm --name "quran-app" -- start
pm2 start npm --name "video-worker" -- run worker
pm2 save
```

## How It Works

1. **User uploads video** → API saves to S3 → Returns immediately (< 5 seconds)
2. **Job added to queue** → Redis stores the job
3. **Worker processes video** → Downloads from S3 → FFmpeg processing → Uploads HLS → Updates database
4. **Frontend polls status** → Shows "Processing..." → Updates to "Completed"

## Testing

1. Start both processes (app + worker)
2. Upload a video through the registration form
3. You should see:
   - "Uploading video..." (immediate)
   - "Processing your video..." (1-3 minutes)
   - "Registration successful!" (when done)

## Troubleshooting

**Worker not starting?**
- Check Redis is running: `redis-cli ping`
- Check `.env` has Redis config
- Check worker logs for errors

**Videos not processing?**
- Ensure worker is running: `npm run worker`
- Check Redis connection
- Check FFmpeg is installed

**Need help?**
- See `QUEUE-SETUP.md` for detailed documentation
- Check worker console logs
- Check database `processing_error` field

## What's Next?

The system is now production-ready! For production deployment:

1. Use PM2 or systemd to manage processes
2. Consider cloud Redis for high availability
3. Monitor queue length and processing times
4. Adjust worker concurrency based on your VPS resources

See `QUEUE-SETUP.md` for production deployment guide.

