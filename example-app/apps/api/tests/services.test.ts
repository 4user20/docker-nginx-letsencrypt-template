// ---------------------------------------------------------------------------
// Services endpoint tests
// ---------------------------------------------------------------------------
import { describe, beforeAll, afterAll, test, expect } from "vitest"
import { buildApp } from "../src/server.js"
import {
  ensureSchema,
  cleanDatabase,
  seedAllTestData,
  disconnectTestDb,
} from "./setup.js"

let app: Awaited<ReturnType<typeof buildApp>>

beforeAll(async () => {
  ensureSchema()
  await cleanDatabase()
  await seedAllTestData()
  app = await buildApp()
})

afterAll(async () => {
  await app.close()
  await disconnectTestDb()
})

describe("GET /api/services", () => {
  test("returns list of seeded services", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/services",
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body).toHaveProperty("services")
    expect(Array.isArray(body.services)).toBe(true)
    expect(body.services.length).toBeGreaterThanOrEqual(4)
  })

  test("returns proper service structure", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/services",
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    const service = body.services[0]

    expect(service).toHaveProperty("id")
    expect(service).toHaveProperty("titleRu")
    expect(service).toHaveProperty("titleEn")
    expect(service).toHaveProperty("priceFromRub")
    expect(service).toHaveProperty("depositRub")
    expect(typeof service.priceFromRub).toBe("number")
    expect(typeof service.depositRub).toBe("number")
  })
})
