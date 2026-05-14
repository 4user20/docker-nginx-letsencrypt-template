// ---------------------------------------------------------------------------
// Auth endpoint tests
// ---------------------------------------------------------------------------
import { describe, beforeAll, afterAll, test, expect } from "vitest"
import { buildApp } from "../src/server.js"
import {
  ensureSchema,
  cleanDatabase,
  createWorkspace,
  testPrisma,
  disconnectTestDb,
} from "./setup.js"

let app: Awaited<ReturnType<typeof buildApp>>

beforeAll(async () => {
  ensureSchema()
  await cleanDatabase()
  await createWorkspace()
  app = await buildApp()
})

afterAll(async () => {
  await app.close()
  await disconnectTestDb()
})

describe("POST /api/auth/login", () => {
  test("auto-registers a new user if email does not exist", async () => {
    const email = `new-auto-${Date.now()}@example.com`

    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email },
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body).toHaveProperty("token")
    expect(body).toHaveProperty("user")
    expect(body.user.email).toBe(email)
    expect(body.user.role).toBe("client")

    // Verify the user was actually created
    const created = await testPrisma.user.findUnique({ where: { email } })
    expect(created).not.toBeNull()
  })

  test("returns user + token for existing user", async () => {
    // First call creates the user
    const email = `existing-${Date.now()}@example.com`
    await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email },
    })

    // Second call should return with token
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email },
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body).toHaveProperty("token")
    expect(body).toHaveProperty("user")
    expect(body.user.email).toBe(email)
  })
})

describe("POST /api/auth/demo-login", () => {
  test("returns demo user with admin role", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/demo-login",
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body).toHaveProperty("token")
    expect(body).toHaveProperty("user")
    expect(body.user.email).toBe("anna@slotpay.demo")
    expect(body.user.name).toBe("Анна Соколова")
    expect(body.user.role).toBe("admin")
  })
})

describe("POST /api/auth/register", () => {
  const uniqueId = Date.now()

  test("creates a new user with name/email/password", async () => {
    const email = `register-${uniqueId}@example.com`

    const res = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        name: "New User",
        email,
        password: "securepass",
      },
    })

    expect(res.statusCode).toBe(201)
    const body = JSON.parse(res.body)
    expect(body).toHaveProperty("token")
    expect(body).toHaveProperty("user")
    expect(body.user.name).toBe("New User")
    expect(body.user.email).toBe(email)
    expect(body.user.role).toBe("client")
  })

  test("returns 422 for short password", async () => {
    const email = `shortpw-${uniqueId}@example.com`

    const res = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        name: "Short PW",
        email,
        password: "short",
      },
    })

    expect(res.statusCode).toBe(422)
    const body = JSON.parse(res.body)
    expect(body.error).toBe("Validation Error")
    expect(body.statusCode).toBe(422)
    expect(body.fields).toBeDefined()
  })

  test("returns 409 for duplicate email", async () => {
    const email = `duplicate-${uniqueId}@example.com`

    // First registration
    await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        name: "First User",
        email,
        password: "securepass",
      },
    })

    // Duplicate registration
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        name: "Second User",
        email,
        password: "securepass",
      },
    })

    expect(res.statusCode).toBe(409)
    const body = JSON.parse(res.body)
    expect(body.error).toBe("Conflict")
    expect(body.message).toBe("Email already registered")
  })
})

describe("GET /api/me", () => {
  test("returns current user with valid token", async () => {
    const email = `me-test-${Date.now()}@example.com`
    const loginRes = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email },
    })
    const { token } = JSON.parse(loginRes.body)

    const res = await app.inject({
      method: "GET",
      url: "/api/me",
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.email).toBe(email)
    expect(body).toHaveProperty("id")
    expect(body).toHaveProperty("name")
    expect(body).toHaveProperty("role")
    expect(body).toHaveProperty("workspaceId")
  })

  test("returns 401 without token", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/me",
    })

    expect(res.statusCode).toBe(401)
    const body = JSON.parse(res.body)
    expect(body.error).toBe("Unauthorized")
  })
})
