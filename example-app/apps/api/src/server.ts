import Fastify from "fastify"
import cors from "@fastify/cors"
import { config } from "./config.js"
import { logger } from "./logger.js"
import { errorHandler } from "./middleware/errorHandler.js"
import authMiddleware from "./middleware/auth.js"
import healthRoutes from "./routes/health.js"
import authRoutes from "./routes/auth.js"
import leadRoutes from "./routes/leads.js"
import checklistRoutes from "./routes/checklists.js"
import deploymentRoutes from "./routes/deployment.js"
import metricsPlugin from "./metrics.js"
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

export async function buildApp() {
  const app = Fastify({
    logger: false,
  })

  await app.register(cors, { origin: config.corsOrigin })
  await app.register(errorHandler)
  await app.register(authMiddleware)
  await app.register(healthRoutes)
  await app.register(authRoutes)
  await app.register(leadRoutes)
  await app.register(checklistRoutes)
  await app.register(deploymentRoutes)
  await app.register(metricsPlugin)

  return app
}

export async function startServer() {
  const app = await buildApp()

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`)
    await app.close()
    await prisma.$disconnect()
    process.exit(0)
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"))
  process.on("SIGINT", () => shutdown("SIGINT"))

  try {
    await app.listen({ port: config.port, host: config.host })
    logger.info(`Server listening on ${config.host}:${config.port}`)
  } catch (err) {
    logger.error(err, "Failed to start server")
    await prisma.$disconnect()
    process.exit(1)
  }
}
