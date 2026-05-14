// ---------------------------------------------------------------------------
// Bookings endpoint tests
// ---------------------------------------------------------------------------
import { describe, beforeAll, afterAll, test, expect } from "vitest"
import { buildApp } from "../src/server.js"
import {
  ensureSchema,
  cleanDatabase,
  seedAllTestData,
  seedBookings,
  testPrisma,
  disconnectTestDb,
} from "./setup.js"

let app: Awaited<ReturnType<typeof buildApp>>
let adminToken: string

beforeAll(async () => {
  ensureSchema()
  await cleanDatabase()
  await seedAllTestData()
  await seedBookings()
  app = await buildApp()

  // Login as admin to get a token
  const loginRes = await app.inject({
    method: "POST",
    url: "/api/auth/demo-login",
  })
  adminToken = JSON.parse(loginRes.body).token
})

afterAll(async () => {
  await app.close()
  await disconnectTestDb()
})

describe("POST /api/bookings", () => {
  test("creates a booking with valid data", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/bookings",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        clientName: "Test Client",
        clientEmail: "test-create@example.com",
        clientPhone: "+7 (999) 111-11-11",
        serviceId: "svc_landing",
        date: "2026-06-15",
        time: "10:00",
        amountRub: 2000,
      },
    })

    expect(res.statusCode).toBe(201)
    const body = JSON.parse(res.body)
    expect(body).toHaveProperty("booking")
    expect(body).toHaveProperty("idempotencyKey")
    expect(body.booking.clientName).toBe("Test Client")
    expect(body.booking.status).toBe("new")
    expect(body.booking.serviceId).toBe("svc_landing")
  })

  test("returns 422 with invalid data", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/bookings",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        // Missing required fields
        clientName: "",
        clientEmail: "not-an-email",
        clientPhone: "",
        serviceId: "",
        date: "",
        time: "",
        amountRub: -1,
      },
    })

    expect(res.statusCode).toBe(422)
    const body = JSON.parse(res.body)
    expect(body.error).toBe("Validation Error")
    expect(body.statusCode).toBe(422)
  })

  test("returns 401 without auth token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/bookings",
      payload: {
        clientName: "Test Client",
        clientEmail: "test-unauth@example.com",
        clientPhone: "+7 (999) 111-11-11",
        serviceId: "svc_landing",
        date: "2026-06-15",
        time: "10:00",
        amountRub: 2000,
      },
    })

    expect(res.statusCode).toBe(401)
  })
})

describe("GET /api/bookings", () => {
  test("returns bookings list", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/bookings",
      headers: { authorization: `Bearer ${adminToken}` },
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body).toHaveProperty("bookings")
    expect(Array.isArray(body.bookings)).toBe(true)
    expect(body.bookings.length).toBeGreaterThanOrEqual(6)
  })

  test("filters by status", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/bookings?status=paid",
      headers: { authorization: `Bearer ${adminToken}` },
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.bookings.every((b: { status: string }) => b.status === "paid")).toBe(true)
  })

  test("returns 401 without auth token", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/bookings",
    })

    expect(res.statusCode).toBe(401)
  })
})

describe("PATCH /api/bookings/:id/status", () => {
  test("updates booking status", async () => {
    // Use a booking with "new" status
    const res = await app.inject({
      method: "PATCH",
      url: "/api/bookings/bk_gamma/status",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { status: "cancelled" },
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body).toHaveProperty("booking")
    expect(body.booking.id).toBe("bk_gamma")
    expect(body.booking.status).toBe("cancelled")
  })

  test("returns 404 for non-existent booking", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/api/bookings/non-existent-id/status",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { status: "cancelled" },
    })

    expect(res.statusCode).toBe(404)
    const body = JSON.parse(res.body)
    expect(body.error).toBe("Not Found")
  })

  test("returns 422 for invalid status", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/api/bookings/bk_delta/status",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { status: "invalid-status" },
    })

    expect(res.statusCode).toBe(422)
  })
})

describe("POST /api/bookings/:id/pay", () => {
  test("processes payment for a booking", async () => {
    // bk_delta has status "new" — create a fresh one to be safe
    const createRes = await app.inject({
      method: "POST",
      url: "/api/bookings",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        clientName: "Pay Test",
        clientEmail: "pay-test@example.com",
        clientPhone: "+7 (999) 555-55-55",
        serviceId: "svc_landing",
        date: "2026-07-01",
        time: "12:00",
        amountRub: 2000,
      },
    })
    const newBooking = JSON.parse(createRes.body).booking

    const res = await app.inject({
      method: "POST",
      url: `/api/bookings/${newBooking.id}/pay`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { idempotencyKey: `pay-test-key-${Date.now()}` },
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body).toHaveProperty("paymentId")
    expect(body).toHaveProperty("status", "paid")
  })

  test("is idempotent — second call returns same paymentId", async () => {
    // Create a fresh booking
    const createRes = await app.inject({
      method: "POST",
      url: "/api/bookings",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        clientName: "Idempotent Test",
        clientEmail: "idempotent-test@example.com",
        clientPhone: "+7 (999) 666-66-66",
        serviceId: "svc_landing",
        date: "2026-07-02",
        time: "14:00",
        amountRub: 2000,
      },
    })
    const newBooking = JSON.parse(createRes.body).booking
    const idempotencyKey = `idem-key-${Date.now()}`

    // First payment call
    const firstRes = await app.inject({
      method: "POST",
      url: `/api/bookings/${newBooking.id}/pay`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { idempotencyKey },
    })
    const firstBody = JSON.parse(firstRes.body)

    // Second payment call with different idempotencyKey
    const secondRes = await app.inject({
      method: "POST",
      url: `/api/bookings/${newBooking.id}/pay`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { idempotencyKey: `idem-key-2-${Date.now()}` },
    })
    const secondBody = JSON.parse(secondRes.body)

    expect(secondBody.paymentId).toBe(firstBody.paymentId)
    expect(secondBody.status).toBe("paid")
  })
})
