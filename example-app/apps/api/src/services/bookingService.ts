import crypto from "crypto"
import { prisma } from "../server.js"

export function generatePaymentId(): string {
  return "pay_" + crypto.randomBytes(4).toString("hex")
}

export function generateIdempotencyKey(): string {
  return crypto.randomUUID()
}

export interface CreateBookingInput {
  clientName: string
  clientEmail: string
  clientPhone: string
  serviceId: string
  date: string
  time: string
  amountRub: number
  workspaceId: string
}

export async function createBooking(input: CreateBookingInput) {
  const idempotencyKey = generateIdempotencyKey()
  const booking = await prisma.booking.create({
    data: {
      clientName: input.clientName,
      clientEmail: input.clientEmail,
      clientPhone: input.clientPhone,
      serviceId: input.serviceId,
      date: new Date(input.date),
      time: input.time,
      amountRub: input.amountRub,
      workspaceId: input.workspaceId,
      status: "new",
      idempotencyKey,
    },
    include: { service: true },
  })
  return { booking, idempotencyKey }
}

export async function processPayment(
  bookingId: string,
  idempotencyKey: string,
  workspaceId: string
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  })

  if (!booking) {
    throw new Error("Booking not found")
  }

  // Check if already paid
  if (booking.status === "paid" && booking.paymentId) {
    return { paymentId: booking.paymentId, status: "paid" as const }
  }

  const paymentId = generatePaymentId()

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        id: paymentId,
        bookingId,
        workspaceId,
        amountRub: booking.amountRub,
        status: "succeeded",
        idempotencyKey,
      },
    }),
    prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "paid",
        paymentId,
      },
    }),
  ])

  return { paymentId, status: "paid" as const }
}

export async function getStats(workspaceId: string) {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart)
  todayEnd.setDate(todayEnd.getDate() + 1)

  const [todayCount, paidBookings, allCount, revenueGroup] = await Promise.all([
    prisma.booking.count({
      where: {
        workspaceId,
        createdAt: { gte: todayStart, lt: todayEnd },
      },
    }),
    prisma.booking.findMany({
      where: { workspaceId, status: "paid" },
    }),
    prisma.booking.count({
      where: { workspaceId },
    }),
    prisma.booking.groupBy({
      by: ["serviceId"],
      where: { workspaceId, status: "paid" },
      _sum: { amountRub: true },
    }),
  ])

  const paidCount = paidBookings.length
  const totalPaidAmount = paidBookings.reduce((sum, b) => sum + b.amountRub, 0)

  const conversion = allCount > 0 ? Math.round((paidCount / allCount) * 100) : 0
  const avgTicket = paidCount > 0 ? Math.round(totalPaidAmount / paidCount) : 0

  const serviceIds = revenueGroup.map((r) => r.serviceId)
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
  })
  const serviceMap = new Map(services.map((s) => [s.id, s]))

  const revenueByService = revenueGroup.map((r) => {
    const service = serviceMap.get(r.serviceId)
    const amount = r._sum.amountRub || 0
    const percent = totalPaidAmount > 0
      ? Math.round((amount / totalPaidAmount) * 100)
      : 0
    return {
      serviceId: r.serviceId,
      title: service?.titleRu || "Unknown",
      amount,
      percent,
    }
  })

  return {
    todayCount,
    paidCount,
    conversion,
    avgTicket,
    revenueByService,
  }
}
