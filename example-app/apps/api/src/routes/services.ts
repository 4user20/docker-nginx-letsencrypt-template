import { FastifyInstance } from "fastify"
import fp from "fastify-plugin"
import { prisma } from "../server.js"

const WORKSPACE_ID = "ws_studio_42"

async function serviceRoutes(app: FastifyInstance) {
  // ── GET /api/services ──────────────────────────────────────────
  app.get("/api/services", async () => {
    const services = await prisma.service.findMany({
      where: { workspaceId: WORKSPACE_ID },
      orderBy: { createdAt: "asc" },
    })

    return { services }
  })
}

export default fp(serviceRoutes, { name: "service-routes" })
