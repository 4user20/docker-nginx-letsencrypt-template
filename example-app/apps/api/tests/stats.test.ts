// ---------------------------------------------------------------------------
// Stats endpoint tests
// ---------------------------------------------------------------------------
import { describe, beforeAll, afterAll, test, expect } from "vitest"
import { buildApp } from "../src/server.js"
import {
  ensureSchema,
  cleanDatabase,
  seedAllTestData,
  seedBookings,
  disconnectTestDb,
} from "./setup.js"

let app: Awaited<ReturnType<typeof buildApp>>
let adminToken: string
let clientToken: string

beforeAll(async () => {
  ensureSchema()
  await cleanDatabase()
  await seedAllTestData()
  await seedBookings()
  app = await buildApp()

  // Admin token
  const adminRes = await app.inject({
    method: "POST",
    url: "/api/auth/demo-login",
  })
  adminToken = JSON.parse(adminRes.body).token

  // Non-admin token (auto-register)
  const clientRes = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email: `stats-nonadmin-${Date.now()}@example.com` },
  })
  clientToken = JSON.parse(clientRes.body).token
})

afterAll(async () => {
  await app.close()
  await disconnectTestDb()
})

describe("GET /api/stats", () => {
  test("returns KPI data for admin", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stats",
      headers: { authorization: `Bearer ${adminToken}` },
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)

    // With the seeded data we have 2 paid bookings and 6 total
    expect(body).toHaveProperty("todayCount")
    expect(body).toHaveProperty("paidCount")
    expect(body).toHaveProperty("conversion")
    expect(body).toHaveProperty("avgTicket")
    expect(body).toHaveProperty("revenueByService")
    expect(Array.isArray(body.revenueByService)).toBe(true)

    expect(typeof body.paidCount).toBe("number")
    expect(typeof body.conversion).toBe("number")
    expect(typeof body.avgTicket).toBe("number")
  })

  test("returns 403 for non-admin users", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stats",
      headers: { authorization: `Bearer ${clientToken}` },
    })

    expect(res.statusCode).toBe(403)
    const body = JSON.parse(res.body)
    expect(body.error).toBe("Forbidden")
    expect(body.message).toBe("Admin access required")
  })

  test("returns 401 without auth token", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stats",
    })

    expect(res.statusCode).toBe(401)
  })
})
