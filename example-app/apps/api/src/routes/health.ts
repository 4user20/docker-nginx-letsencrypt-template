import { FastifyInstance } from "fastify"
import fp from "fastify-plugin"
import { prisma } from "../server.js"

async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async () => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage().heapUsed,
    }
  })

  app.get("/ready", async () => {
    let dbConnected = false
    try {
      await prisma.$queryRaw`SELECT 1`
      dbConnected = true
    } catch {
      dbConnected = false
    }

    return {
      status: dbConnected ? "ok" : "degraded",
      database: dbConnected ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    }
  })
}

export default fp(healthRoutes, { name: "health-routes" })
