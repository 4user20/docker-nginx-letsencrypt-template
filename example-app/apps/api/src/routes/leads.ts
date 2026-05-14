import { FastifyInstance } from "fastify"
import { z } from "zod"
import { prisma } from "../server.js"
import { scoreLead } from "../services/leadScoring.js"

const createLeadSchema = z.object({
  title: z.string().min(1),
  source: z.string().optional().default("manual"),
  budgetText: z.string().optional().nullable(),
  stackText: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  redFlags: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

const updateLeadSchema = z.object({
  title: z.string().min(1).optional(),
  source: z.string().optional(),
  budgetText: z.string().optional().nullable(),
  stackText: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.string().optional(),
  redFlags: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

async function leadRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate)

  app.get("/api/leads", async (request) => {
    const { status, source, search } = request.query as { status?: string; source?: string; search?: string }

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (source) where.source = source
    if (search) where.title = { contains: search, mode: "insensitive" }

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    return { leads }
  })

  app.post("/api/leads", async (request, reply) => {
    const body = createLeadSchema.parse(request.body)
    const userId = request.user!.userId

    const lead = await prisma.lead.create({
      data: {
        ...body,
        userId,
      },
    })

    reply.status(201)
    return { lead }
  })

  app.patch("/api/leads/:id", async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = updateLeadSchema.parse(request.body)
    const userId = request.user!.userId

    const existing = await prisma.lead.findUnique({ where: { id } })
    if (!existing) {
      reply.status(404).send({ error: "Not Found", message: "Lead not found" })
      return
    }

    if (existing.userId !== userId) {
      reply.status(403).send({ error: "Forbidden", message: "You do not own this lead" })
      return
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: body,
    })

    return { lead }
  })

  app.post("/api/leads/:id/score", async (request, reply) => {
    const { id } = request.params as { id: string }

    const lead = await prisma.lead.findUnique({ where: { id } })
    if (!lead) {
      reply.status(404).send({ error: "Not Found", message: "Lead not found" })
      return
    }

    const result = scoreLead({
      title: lead.title,
      source: lead.source,
      budgetText: lead.budgetText,
      stackText: lead.stackText,
      description: lead.description,
      redFlags: lead.redFlags,
    })

    const scoreRecord = await prisma.leadScore.create({
      data: {
        leadId: id,
        score: result.score,
        reasons: result.reasons,
        redFlags: result.redFlags,
      },
    })

    await prisma.lead.update({
      where: { id },
      data: { fitScore: result.score },
    })

    return {
      score: scoreRecord.score,
      reasons: scoreRecord.reasons,
      redFlags: scoreRecord.redFlags,
    }
  })
}

export default leadRoutes
