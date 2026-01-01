import Redis from "ioredis";

// Redis connection configuration
export function getRedisClient(): Redis {
  const redisUrl = process.env.REDIS_URL;
  
  if (redisUrl) {
    // Use Redis URL if provided (for production/cloud Redis)
    return new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });
  }

  // Default to local Redis
  return new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });
}

// Test Redis connection
export async function testRedisConnection(): Promise<boolean> {
  try {
    const redis = getRedisClient();
    await redis.ping();
    redis.disconnect();
    return true;
  } catch (error) {
    console.error("Redis connection error:", error);
    return false;
  }
}

