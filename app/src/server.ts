import Fastify from 'fastify';
import { createClient } from 'redis';
import { z } from 'zod';

// Types
interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'healthy' | 'unhealthy';
    redis: 'healthy' | 'unhealthy';
  };
  uptime: number;
}

interface MetricsResponse {
  http_requests_total: number;
  http_request_duration_seconds: number;
  nodejs_heap_size_bytes: number;
  nodejs_external_memory_bytes: number;
}

// Initialize Fastify
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  },
});

// Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://redis:6379',
  password: process.env.REDIS_PASSWORD,
});

// Metrics
let requestCount = 0;
let totalRequestDuration = 0;
const startTime = Date.now();

// Request tracking
fastify.addHook('onRequest', async (request, reply) => {
  request.startTime = Date.now();
});

fastify.addHook('onResponse', async (request, reply) => {
  const duration = Date.now() - (request.startTime || Date.now());
  requestCount++;
  totalRequestDuration += duration;
});

// Health check endpoint
fastify.get<{ Reply: HealthCheckResponse }>('/health', async (request, reply) => {
  let databaseHealth: 'healthy' | 'unhealthy' = 'healthy';
  let redisHealth: 'healthy' | 'unhealthy' = 'healthy';

  // Check Redis connectivity
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    await redisClient.ping();
  } catch (error) {
    fastify.log.error('Redis health check failed:', error);
    redisHealth = 'unhealthy';
  }

  // Check database connectivity (if using Prisma)
  try {
    // In a real application, you would check database connectivity here
    // For this example, we'll assume it's healthy
    databaseHealth = 'healthy';
  } catch (error) {
    fastify.log.error('Database health check failed:', error);
    databaseHealth = 'unhealthy';
  }

  const isHealthy = databaseHealth === 'healthy' && redisHealth === 'healthy';
  const statusCode = isHealthy ? 200 : 503;

  return reply.status(statusCode).send({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: {
      database: databaseHealth,
      redis: redisHealth,
    },
    uptime: Math.floor((Date.now() - startTime) / 1000),
  });
});

// Metrics endpoint
fastify.get<{ Reply: MetricsResponse }>('/metrics', async (request, reply) => {
  const memUsage = process.memoryUsage();

  return reply.send({
    http_requests_total: requestCount,
    http_request_duration_seconds: totalRequestDuration / 1000,
    nodejs_heap_size_bytes: memUsage.heapUsed,
    nodejs_external_memory_bytes: memUsage.external,
  });
});

// API endpoint example
fastify.get('/api/status', async (request, reply) => {
  return reply.send({
    data: {
      message: 'Portfolio API is running',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    },
  });
});

// API endpoint with Redis caching example
fastify.get<{ Params: { key: string } }>('/api/cache/:key', async (request, reply) => {
  const { key } = request.params;

  try {
    // Try to get from Redis
    if (redisClient.isOpen) {
      const cached = await redisClient.get(key);
      if (cached) {
        return reply.send({
          data: JSON.parse(cached),
          source: 'cache',
        });
      }
    }

    // Generate data
    const data = {
      key,
      value: `Data for ${key}`,
      timestamp: new Date().toISOString(),
    };

    // Store in Redis
    if (redisClient.isOpen) {
      await redisClient.setEx(key, 3600, JSON.stringify(data));
    }

    return reply.send({
      data,
      source: 'generated',
    });
  } catch (error) {
    fastify.log.error('Cache endpoint error:', error);
    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Failed to process cache request',
    });
  }
});

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  return reply.status(statusCode).send({
    statusCode,
    error: error.name || 'Error',
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : message,
    timestamp: new Date().toISOString(),
  });
});

// Graceful shutdown
const gracefulShutdown = async () => {
  fastify.log.info('Shutting down gracefully...');

  try {
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
    await fastify.close();
    process.exit(0);
  } catch (error) {
    fastify.log.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const start = async () => {
  try {
    // Connect to Redis
    try {
      await redisClient.connect();
      fastify.log.info('Connected to Redis');
    } catch (error) {
      fastify.log.warn('Failed to connect to Redis:', error);
    }

    const port = parseInt(process.env.PORT || '3000', 10);
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });
    fastify.log.info(`Server listening on ${host}:${port}`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};

start();

// Extend FastifyRequest to include startTime
declare global {
  namespace FastifyInstance {
    interface FastifyRequest {
      startTime?: number;
    }
  }
}
