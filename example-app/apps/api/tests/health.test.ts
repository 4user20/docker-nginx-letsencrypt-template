import { describe, it, expect, afterAll } from "vitest"
import Fastify from "fastify"
import healthRoutes from "../src/routes/health.js"

describe("health routes", () => {
  const app = Fastify()

  afterAll(async () => {
    await app.close()
  })

  it("GET /health returns 200 with expected shape", async () => {
    await app.register(healthRoutes)
    await app.ready()

    const response = await app.inject({
      method: "GET",
      url: "/health",
    })

    expect(response.statusCode).toBe(200)

    const body = JSON.parse(response.body)
    expect(body).toHaveProperty("status", "ok")
    expect(body).toHaveProperty("timestamp")
    expect(body).toHaveProperty("uptime")
    expect(body).toHaveProperty("memory")
  })
})
