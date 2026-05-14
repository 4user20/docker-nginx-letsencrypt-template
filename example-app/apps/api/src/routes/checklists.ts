import { FastifyInstance } from "fastify"
import { z } from "zod"
import { prisma } from "../server.js"

const updateItemSchema = z.object({
  itemId: z.string().min(1),
  status: z.string().min(1),
  evidence: z.string().optional().nullable(),
})

async function checklistRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate)

  app.get("/api/checklists", async () => {
    const templates = await prisma.checklistTemplate.findMany({
      include: { items: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "asc" },
    })

    return { templates }
  })

  app.post("/api/checklists", async (request, reply) => {
    const body = updateItemSchema.parse(request.body)

    const item = await prisma.checklistItem.update({
      where: { id: body.itemId },
      data: {
        status: body.status,
        ...(body.evidence !== undefined ? { evidence: body.evidence } : {}),
      },
    })

    return { item }
  })
}

export default checklistRoutes
