import { FastifyInstance } from "fastify"
import fp from "fastify-plugin"
import { z } from "zod"
import { prisma } from "../server.js"
import { createBooking, processPayment } from "../services/bookingService.js"

const WORKSPACE_ID = "ws_studio_42"

const createBookingSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Invalid email address"),
  clientPhone: z.string().min(1, "Client phone is required"),
  serviceId: z.string().min(1, "Service ID is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  amountRub: z.number().int().positive("Amount must be positive"),
})

const updateStatusSchema = z.object({
  status: z.enum(["new", "paid", "cancelled"]),
})

const paySchema = z.object({
  idempotencyKey: z.string().min(1, "Idempotency key is required"),
})

async function bookingRoutes(app: FastifyInstance) {
  // ── GET /api/bookings ──────────────────────────────────────────
  app.get("/api/bookings", { preHandler: app.authenticate }, async (request) => {
    const query = request.query as { status?: string; search?: string }

    const where: Record<string, unknown> = {
      workspaceId: WORKSPACE_ID,
    }

    if (query.status) {
      where.status = query.status
    }

    if (query.search) {
      where.OR = [
        { clientName: { contains: query.search, mode: "insensitive" } },
        { clientEmail: { contains: query.search, mode: "insensitive" } },
      ]
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: { service: true },
      orderBy: { createdAt: "desc" },
    })

    return { bookings }
  })

  // ── POST /api/bookings ─────────────────────────────────────────
  app.post("/api/bookings", { preHandler: app.authenticate }, async (request, reply) => {
    const body = createBookingSchema.parse(request.body)

    const result = await createBooking({
      ...body,
      workspaceId: WORKSPACE_ID,
    })

    reply.status(201)
    return {
      booking: result.booking,
      idempotencyKey: result.idempotencyKey,
    }
  })

  // ── PATCH /api/bookings/:id/status ─────────────────────────────
  app.patch("/api/bookings/:id/status", { preHandler: app.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = updateStatusSchema.parse(request.body)

    const existing = await prisma.booking.findUnique({ where: { id } })
    if (!existing) {
      reply.status(404).send({ error: "Not Found", message: "Booking not found" })
      return
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: { status: body.status },
      include: { service: true },
    })

    return { booking }
  })

  // ── POST /api/bookings/:id/pay ─────────────────────────────────
  app.post("/api/bookings/:id/pay", { preHandler: app.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = paySchema.parse(request.body)

    try {
      const result = await processPayment(id, body.idempotencyKey, WORKSPACE_ID)
      return {
        paymentId: result.paymentId,
        idempotencyKey: body.idempotencyKey,
        status: result.status,
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Payment processing failed"
      if (message === "Booking not found") {
        reply.status(404).send({ error: "Not Found", message })
        return
      }
      reply.status(500).send({ error: "Payment Error", message })
      return
    }
  })
}

export default fp(bookingRoutes, { name: "booking-routes" })
