import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10)

  // ---------------------------------------------------------------------------
  // Workspace
  // ---------------------------------------------------------------------------
  const workspace = await prisma.workspace.upsert({
    where: { id: "ws_studio_42" },
    update: {},
    create: {
      id: "ws_studio_42",
      name: "SlotPay Demo Studio",
    },
  })
  console.log("Created workspace:", workspace.name)

  // ---------------------------------------------------------------------------
  // Users
  // ---------------------------------------------------------------------------
  const admin = await prisma.user.upsert({
    where: { email: "anna@slotpay.demo" },
    update: {},
    create: {
      name: "Анна Соколова",
      email: "anna@slotpay.demo",
      passwordHash,
      role: "admin",
      workspaceId: workspace.id,
    },
  })
  console.log("Created admin user:", admin.name)

  await prisma.user.upsert({
    where: { email: "client@demo.com" },
    update: {},
    create: {
      name: "Демо Клиент",
      email: "client@demo.com",
      passwordHash,
      role: "client",
      workspaceId: workspace.id,
    },
  })
  console.log('Created client user: Демо Клиент')

  // ---------------------------------------------------------------------------
  // Services
  // ---------------------------------------------------------------------------
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
      titleRu: "Платёжный модуль + интеграция",
      titleEn: "Payment module + integration",
      descRu:
        "Интеграция платёжного шлюза с поддержкой предоплат и полных оплат. ЮKassa / CloudPayments.",
      descEn:
        "Payment gateway integration with prepayment and full payment support. YooKassa / CloudPayments.",
      priceFromRub: 90000,
      depositRub: 4000,
    },
    {
      id: "svc_miniapp",
      titleRu: "Telegram Mini App",
      titleEn: "Telegram Mini App",
      descRu:
        "Telegram Mini App с интерфейсом бронирования и оплаты. Оптимизировано для мобильных устройств.",
      descEn:
        "Telegram Mini App with booking and payment interface. Optimized for mobile devices.",
      priceFromRub: 120000,
      depositRub: 5000,
    },
  ]

  for (const svc of serviceDefs) {
    await prisma.service.upsert({
      where: { id: svc.id },
      update: {},
      create: { ...svc, workspaceId: workspace.id },
    })
  }
  console.log(`Created ${serviceDefs.length} services`)

  // ---------------------------------------------------------------------------
  // Bookings
  // ---------------------------------------------------------------------------
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
      status: "paid",
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
      status: "paid",
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
      status: "new",
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
      status: "new",
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
      status: "cancelled",
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
      status: "new",
      paymentId: null,
      idempotencyKey: null,
    },
  ]

  for (const booking of bookingDefs) {
    await prisma.booking.upsert({
      where: { id: booking.id },
      update: {},
      create: { ...booking, workspaceId: workspace.id },
    })
  }
  console.log(`Created ${bookingDefs.length} bookings`)

  // ---------------------------------------------------------------------------
  // Payments (audit trail for the "paid" bookings)
  // ---------------------------------------------------------------------------
  const paymentDefs = [
    {
      id: "pay_alpha",
      bookingId: "bk_alpha",
      workspaceId: workspace.id,
      amountRub: 2000,
      currency: "RUB",
      status: "succeeded",
      idempotencyKey: "ip_alpha",
      gatewayResponse: { id: "ch_alpha", status: "succeeded", method: "card" },
    },
    {
      id: "pay_beta",
      bookingId: "bk_beta",
      workspaceId: workspace.id,
      amountRub: 3000,
      currency: "RUB",
      status: "succeeded",
      idempotencyKey: "ip_beta",
      gatewayResponse: { id: "ch_beta", status: "succeeded", method: "card" },
    },
  ]

  for (const payment of paymentDefs) {
    await prisma.payment.upsert({
      where: { id: payment.id },
      update: {},
      create: payment,
    })
  }
  console.log(`Created ${paymentDefs.length} payments`)

  // ---------------------------------------------------------------------------
  // Done
  // ---------------------------------------------------------------------------
  console.log("Seeding complete!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
