import { FastifyInstance } from "fastify"
import fp from "fastify-plugin"
import { getStats } from "../services/bookingService.js"

const WORKSPACE_ID = "ws_studio_42"

async function statsRoutes(app: FastifyInstance) {
  // ── GET /api/stats ─────────────────────────────────────────────
  app.get("/api/stats", { preHandler: app.authenticate }, async (request, reply) => {
    const user = request.user

    // Only admin can view stats
    if (!user || user.role !== "admin") {
      reply.status(403).send({ error: "Forbidden", message: "Admin access required" })
      return
    }

    const stats = await getStats(WORKSPACE_ID)

    return stats
  })
}

export default fp(statsRoutes, { name: "stats-routes" })
