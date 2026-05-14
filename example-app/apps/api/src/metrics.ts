import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify"
import fp from "fastify-plugin"
import client from "prom-client"

const register = new client.Registry()

client.collectDefaultMetrics({ register })

const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"] as const,
  registers: [register],
})

const httpRequestDurationSeconds = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route"] as const,
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
})

const memoryUsageBytes = new client.Gauge({
  name: "memory_usage_bytes",
  help: "Current memory usage in bytes",
  labelNames: [] as const,
  registers: [register],
})

const uptimeSeconds = new client.Gauge({
  name: "uptime_seconds",
  help: "Server uptime in seconds",
  labelNames: [] as const,
  registers: [register],
})

export async function metricsPlugin(app: FastifyInstance) {
  app.get("/metrics", async (_req: FastifyRequest, reply: FastifyReply) => {
    memoryUsageBytes.set(process.memoryUsage().heapUsed)
    uptimeSeconds.set(process.uptime())
    reply.header("Content-Type", register.contentType)
    return register.metrics()
  })

  app.addHook("onResponse", (request: FastifyRequest, reply: FastifyReply, done: () => void) => {
    httpRequestsTotal.inc({
      method: request.method,
      route: request.routeOptions?.url || request.url,
      status: reply.statusCode.toString(),
    })
    httpRequestDurationSeconds.observe(
      { method: request.method, route: request.routeOptions?.url || request.url },
      reply.elapsedTime / 1000
    )
    done()
  })
}

export default fp(metricsPlugin, { name: "metrics" })
