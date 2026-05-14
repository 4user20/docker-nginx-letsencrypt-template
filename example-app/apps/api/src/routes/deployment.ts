import { FastifyInstance } from "fastify"
import { config } from "../config.js"
import { prisma } from "../server.js"

async function deploymentRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate)

  app.get("/api/deployments/status", async () => {
    let dbConnected = false
    try {
      await prisma.$queryRaw`SELECT 1`
      dbConnected = true
    } catch {
      dbConnected = false
    }

    return {
      version: config.appVersion,
      commitSha: config.gitSha,
      environment: config.nodeEnv,
      uptime: process.uptime(),
      dbStatus: dbConnected ? "connected" : "disconnected",
      redisStatus: config.redisUrl ? "enabled" : "not_configured",
    }
  })
}

export default deploymentRoutes
