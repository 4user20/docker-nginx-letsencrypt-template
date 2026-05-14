// ---------------------------------------------------------------------------
// Health endpoint tests
// ---------------------------------------------------------------------------
import { describe, beforeAll, afterAll, test, expect } from "vitest"
import { buildApp } from "../src/server.js"
import { ensureSchema, disconnectTestDb } from "./setup.js"

let app: Awaited<ReturnType<typeof buildApp>>

beforeAll(async () => {
  ensureSchema()
  app = await buildApp()
})

afterAll(async () => {
  await app.close()
  await disconnectTestDb()
})

describe("GET /health", () => {
  test("returns 200 with status ok", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/health",
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body).toHaveProperty("status", "ok")
    expect(body).toHaveProperty("timestamp")
    expect(body).toHaveProperty("uptime")
  })
})

describe("GET /ready", () => {
  test("returns 200 with database status", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/ready",
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body).toHaveProperty("status")
    expect(body).toHaveProperty("database")
    expect(["ok", "degraded"]).toContain(body.status)
    expect(["connected", "disconnected"]).toContain(body.database)
  })
})
