import { FastifyInstance } from "fastify"
import fp from "fastify-plugin"
import { z } from "zod"
import { prisma } from "../server.js"

const WORKSPACE_ID = "ws_studio_42"

const serviceSchema = z.object({
  titleRu: z.string().min(1),
  titleEn: z.string().min(1),
  descRu: z.string().min(1),
  descEn: z.string().min(1),
  priceFromRub: z.number().int().positive(),
  depositRub: z.number().int().positive(),
})

async function serviceRoutes(app: FastifyInstance) {
  // ══════════════════════════════════════════════════════════════
  // GET /api/services — public, returns workspace services
  // ══════════════════════════════════════════════════════════════
  app.get("/api/services", async () => {
    const services = await prisma.service.findMany({
      where: { workspaceId: WORKSPACE_ID },
      orderBy: { priceFromRub: "asc" },
    })
    return { services }
  })

  // ══════════════════════════════════════════════════════════════
  // POST /api/services — admin: create service
  // ══════════════════════════════════════════════════════════════
  app.post("/api/services", {
    preHandler: app.authenticate,
  }, async (request, reply) => {
    if (request.user?.role !== "admin") {
      reply.status(403).send({ error: "Forbidden", message: "Admin access required" })
      return
    }
    const body = serviceSchema.parse(request.body)
    const service = await prisma.service.create({
      data: { ...body, workspaceId: WORKSPACE_ID },
    })
    reply.status(201)
    return { service }
  })

  // ══════════════════════════════════════════════════════════════
  // PUT /api/services/:id — admin: update service
  // ══════════════════════════════════════════════════════════════
  app.put("/api/services/:id", {
    preHandler: app.authenticate,
  }, async (request, reply) => {
    if (request.user?.role !== "admin") {
      reply.status(403).send({ error: "Forbidden", message: "Admin access required" })
      return
    }
    const { id } = request.params as { id: string }
    const body = serviceSchema.parse(request.body)
    const service = await prisma.service.update({
      where: { id },
      data: body,
    })
    return { service }
  })

  // ══════════════════════════════════════════════════════════════
  // DELETE /api/services/:id — admin: delete service
  // ══════════════════════════════════════════════════════════════
  app.delete("/api/services/:id", {
    preHandler: app.authenticate,
  }, async (request, reply) => {
    if (request.user?.role !== "admin") {
      reply.status(403).send({ error: "Forbidden", message: "Admin access required" })
      return
    }
    const { id } = request.params as { id: string }
    await prisma.service.delete({ where: { id } })
    return { success: true }
  })
}

export default fp(serviceRoutes, { name: "service-routes" })
