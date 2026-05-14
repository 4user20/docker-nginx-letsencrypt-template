// ---------------------------------------------------------------------------
// Test setup — sets DATABASE_URL, pushes schema, provides test helpers
// ---------------------------------------------------------------------------
import { execSync } from "child_process"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import type { JwtPayload } from "../src/middleware/auth.js"

// ── Test database URL ─────────────────────────────────────────────────────
export const TEST_DATABASE_URL =
  "postgresql://portfolio_user:change-this-secure-password@127.0.0.1:5432/portfolio_test_db"

// Must be set before any Prisma client is instantiated
process.env.DATABASE_URL = TEST_DATABASE_URL

// ── Schema push (runs once per worker) ─────────────────────────────────────
let _schemaPushed = false

export function ensureSchema() {
  if (_schemaPushed) return
  execSync("npx prisma db push --skip-generate", {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    cwd: process.cwd(),
    stdio: "pipe",
  })
  _schemaPushed = true
}

// ── Standalone Prisma client for test fixtures ─────────────────────────────
export const testPrisma = new PrismaClient()

// ── Fixture helpers ────────────────────────────────────────────────────────

export async function createWorkspace(
  id = "ws_studio_42",
  name = "SlotPay Test Studio",
) {
  return testPrisma.workspace.upsert({
    where: { id },
    update: {},
    create: { id, name },
  })
}

export async function createUser(
  overrides: Partial<{
    id: string
    name: string
    email: string
    password: string
    role: string
    workspaceId: string
  }> = {},
) {
  const passwordHash = await bcrypt.hash(overrides.password || "demo1234", 10)
  return testPrisma.user.create({
    data: {
      id: overrides.id ?? undefined,
      name: overrides.name ?? "Test User",
      email: overrides.email ?? `test-${Date.now()}@example.com`,
      passwordHash,
      role: overrides.role ?? "client",
      workspaceId: overrides.workspaceId ?? "ws_studio_42",
    },
  })
}

export async function createService(
  overrides: Partial<{
    id: string
    titleRu: string
    titleEn: string
    descRu: string
    descEn: string
    priceFromRub: number
    depositRub: number
    workspaceId: string
  }> = {},
) {
  return testPrisma.service.create({
    data: {
      id: overrides.id ?? undefined,
      titleRu: overrides.titleRu ?? "Тестовая услуга",
      titleEn: overrides.titleEn ?? "Test Service",
      descRu: overrides.descRu ?? "Описание тестовой услуги",
      descEn: overrides.descEn ?? "Test service description",
      priceFromRub: overrides.priceFromRub ?? 10000,
      depositRub: overrides.depositRub ?? 1000,
      workspaceId: overrides.workspaceId ?? "ws_studio_42",
    },
  })
}

export async function createBooking(
  overrides: Partial<{
    id: string
    clientName: string
    clientEmail: string
    clientPhone: string
    serviceId: string
    date: Date
    time: string
    amountRub: number
    status: string
    paymentId: string | null
    idempotencyKey: string | null
    workspaceId: string
  }> = {},
) {
  return testPrisma.booking.create({
    data: {
      id: overrides.id ?? undefined,
      clientName: overrides.clientName ?? "Test Client",
      clientEmail: overrides.clientEmail ?? "test@example.com",
      clientPhone: overrides.clientPhone ?? "+7 (999) 000-00-00",
      serviceId: overrides.serviceId ?? "", // caller must provide a valid serviceId
      date: overrides.date ?? new Date("2026-06-01"),
      time: overrides.time ?? "10:00",
      amountRub: overrides.amountRub ?? 2000,
      status: overrides.status ?? "new",
      paymentId: overrides.paymentId ?? null,
      idempotencyKey: overrides.idempotencyKey ?? null,
      workspaceId: overrides.workspaceId ?? "ws_studio_42",
    },
  })
}

// ── Token generation ───────────────────────────────────────────────────────
export function generateToken(
  user: { id: string; email: string; role: string; workspaceId: string },
): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      workspaceId: user.workspaceId,
    } satisfies JwtPayload,
    process.env.JWT_SECRET ?? "change-me-in-production-demo-secret",
    { expiresIn: "24h" },
  )
}

// ── Full seed (idempotent — uses upsert) ───────────────────────────────────
export async function seedAllTestData() {
  ensureSchema()
  await createWorkspace()

  // Admin user (matches seed.ts)
  const adminHash = await bcrypt.hash("demo1234", 10)
  await testPrisma.user.upsert({
    where: { email: "anna@slotpay.demo" },
    update: {},
    create: {
      name: "Анна Соколова",
      email: "anna@slotpay.demo",
      passwordHash: adminHash,
      role: "admin",
      workspaceId: "ws_studio_42",
    },
  })

  // Demo client
  await testPrisma.user.upsert({
    where: { email: "client@demo.com" },
    update: {},
    create: {
      name: "Демо Клиент",
      email: "client@demo.com",
      passwordHash: adminHash,
      role: "client",
      workspaceId: "ws_studio_42",
    },
  })

  // Services (matching seed.ts)
  const serviceDefs = [
    {
      id: "svc_landing",
      titleRu: "Лендинг + форма заявки",
      titleEn: "Landing + lead form",
      descRu:
        "Одностраничный сайт с формой сбора заявок. Адаптивный дизайн, SEO-оптимизация, интеграция с CRM.",
      descEn:
        "Single-page website with lead collection form. Responsive design, SEO optimization, CRM integration.",
      priceFromRub: 35000,
      depositRub: 2000,
    },
    {
      id: "svc_booking",
      titleRu: "Онлайн-запись + личный кабинет",
      titleEn: "Online booking + client profile",
      descRu:
        "Система онлайн-записи с личным кабинетом клиента. Управление расписанием, напоминания, история записей.",
      descEn:
        "Online booking system with client personal account. Schedule management, reminders, booking history.",
      priceFromRub: 70000,
      depositRub: 3000,
    },
    {
      id: "svc_payment",
      titleRu: "Mock / payment integration ready",
      titleEn: "Mock / payment integration ready",
      descRu:
        "Интеграция платёжного шлюза с поддержкой предоплат и полных оплат. Mock-режим для тестирования.",
      descEn:
        "Payment gateway integration with prepayment and full payment support. Mock mode for testing.",
      priceFromRub: 90000,
      depositRub: 4000,
    },
    {
      id: "svc_miniapp",
      titleRu: "Mini App / Telegram-ready интерфейс",
      titleEn: "Mini App / Telegram-ready UI",
      descRu:
        "Telegram Mini App с интерфейсом бронирования и оплаты. Оптимизировано для мобильных устройств.",
      descEn:
        "Telegram Mini App with booking and payment interface. Optimized for mobile devices.",
      priceFromRub: 120000,
      depositRub: 5000,
    },
  ]

  for (const svc of serviceDefs) {
    await testPrisma.service.upsert({
      where: { id: svc.id },
      update: {},
      create: { ...svc, workspaceId: "ws_studio_42" },
    })
  }

  return { services: serviceDefs }
}

// ── Seed bookings (for tests that need them) ───────────────────────────────
export async function seedBookings() {
  const bookingDefs = [
    {
      id: "bk_alpha",
      clientName: "Иван Петров",
      clientEmail: "ivan@example.com",
      clientPhone: "+7 (999) 111-22-33",
      serviceId: "svc_landing",
      date: new Date("2026-05-20"),
      time: "10:00",
      amountRub: 2000,
      status: "paid" as const,
      paymentId: "pay_alpha",
      idempotencyKey: "ip_alpha",
    },
    {
      id: "bk_beta",
      clientName: "Елена Смирнова",
      clientEmail: "elena@example.com",
      clientPhone: "+7 (999) 222-33-44",
      serviceId: "svc_booking",
      date: new Date("2026-05-22"),
      time: "14:30",
      amountRub: 3000,
      status: "paid" as const,
      paymentId: "pay_beta",
      idempotencyKey: "ip_beta",
    },
    {
      id: "bk_gamma",
      clientName: "Алексей Кузнецов",
      clientEmail: "aleksey@example.com",
      clientPhone: "+7 (999) 333-44-55",
      serviceId: "svc_payment",
      date: new Date("2026-05-25"),
      time: "11:00",
      amountRub: 4000,
      status: "new" as const,
      paymentId: null,
      idempotencyKey: null,
    },
    {
      id: "bk_delta",
      clientName: "Ольга Фёдорова",
      clientEmail: "olga@example.com",
      clientPhone: "+7 (999) 444-55-66",
      serviceId: "svc_landing",
      date: new Date("2026-06-01"),
      time: "09:00",
      amountRub: 2000,
      status: "new" as const,
      paymentId: null,
      idempotencyKey: null,
    },
    {
      id: "bk_epsilon",
      clientName: "Дмитрий Новиков",
      clientEmail: "dmitry@example.com",
      clientPhone: "+7 (999) 555-66-77",
      serviceId: "svc_miniapp",
      date: new Date("2026-05-18"),
      time: "16:00",
      amountRub: 5000,
      status: "cancelled" as const,
      paymentId: null,
      idempotencyKey: null,
    },
    {
      id: "bk_zeta",
      clientName: "Мария Козлова",
      clientEmail: "maria@example.com",
      clientPhone: "+7 (999) 666-77-88",
      serviceId: "svc_booking",
      date: new Date("2026-06-05"),
      time: "12:00",
      amountRub: 3000,
      status: "new" as const,
      paymentId: null,
      idempotencyKey: null,
    },
  ]

  for (const bk of bookingDefs) {
    await testPrisma.booking.upsert({
      where: { id: bk.id },
      update: {},
      create: { ...bk, workspaceId: "ws_studio_42" },
    })
  }

  // Payments for "paid" bookings
  for (const bk of bookingDefs.filter((b) => b.status === "paid")) {
    await testPrisma.payment.upsert({
      where: { id: bk.paymentId! },
      update: {},
      create: {
        id: bk.paymentId!,
        bookingId: bk.id,
        workspaceId: "ws_studio_42",
        amountRub: bk.amountRub,
        currency: "RUB",
        status: "succeeded",
        idempotencyKey: bk.idempotencyKey!,
        gatewayResponse: { id: `ch_${bk.id}`, status: "succeeded", method: "card" },
      },
    })
  }
}

// ── Database cleanup ───────────────────────────────────────────────────────
export async function cleanDatabase() {
  await testPrisma.payment.deleteMany()
  await testPrisma.booking.deleteMany()
  await testPrisma.service.deleteMany()
  await testPrisma.user.deleteMany()
  await testPrisma.workspace.deleteMany()
}

// ── Disconnect ─────────────────────────────────────────────────────────────
export async function disconnectTestDb() {
  await testPrisma.$disconnect()
}
