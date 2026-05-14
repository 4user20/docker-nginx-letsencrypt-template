import { FastifyInstance } from "fastify"
import fp from "fastify-plugin"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { z } from "zod"
import { config } from "../config.js"
import { prisma } from "../server.js"
import type { JwtPayload } from "../middleware/auth.js"

const WORKSPACE_ID = "ws_studio_42"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
})

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

function generateToken(user: { id: string; email: string; role: string; workspaceId: string }): string {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role, workspaceId: user.workspaceId } satisfies JwtPayload,
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
  )
}

function sanitizeUser(user: { id: string; name: string; email: string; role: string; workspaceId: string }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    workspaceId: user.workspaceId,
  }
}

async function findOrCreateDemoUser() {
  let user = await prisma.user.findUnique({ where: { email: "anna@slotpay.demo" } })
  if (!user) {
    const passwordHash = await bcrypt.hash("demo1234", 10)
    user = await prisma.user.create({
      data: {
        name: "Анна Соколова",
        email: "anna@slotpay.demo",
        passwordHash,
        role: "admin",
        workspaceId: WORKSPACE_ID,
      },
    })
  }
  return user
}

async function authRoutes(app: FastifyInstance) {
  // ── POST /api/auth/register ────────────────────────────────────
  app.post("/api/auth/register", {
    config: { rateLimit: { max: 5, timeWindow: "1 minute" } },
  }, async (request, reply) => {
    const body = registerSchema.parse(request.body)

    const existing = await prisma.user.findUnique({ where: { email: body.email } })
    if (existing) {
      reply.status(409).send({ error: "Conflict", message: "Email already registered" })
      return
    }

    const passwordHash = await bcrypt.hash(body.password, 10)

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash,
        role: "client",
        workspaceId: WORKSPACE_ID,
      },
    })

    const token = generateToken(user)

    reply.status(201)
    return {
      token,
      user: sanitizeUser(user),
    }
  })

  // ── POST /api/auth/login ───────────────────────────────────────
  app.post("/api/auth/login", {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
  }, async (request, reply) => {
    const body = loginSchema.parse(request.body)

    let user = await prisma.user.findUnique({ where: { email: body.email } })

    // Auto-registration: create user if not exists
    if (!user) {
      const passwordHash = await bcrypt.hash("auto-generated", 10)
      user = await prisma.user.create({
        data: {
          name: body.email.split("@")[0],
          email: body.email,
          passwordHash,
          role: "client",
          workspaceId: WORKSPACE_ID,
        },
      })
    }

    const token = generateToken(user)

    return {
      token,
      user: sanitizeUser(user),
    }
  })

  // ── POST /api/auth/demo-login ──────────────────────────────────
  app.post("/api/auth/demo-login", {
    config: { rateLimit: { max: 5, timeWindow: "1 minute" } },
  }, async (_request, _reply) => {
    const user = await findOrCreateDemoUser()
    const token = generateToken(user)

    return {
      token,
      user: sanitizeUser(user),
    }
  })

  // ── POST /api/auth/logout ──────────────────────────────────────
  app.post("/api/auth/logout", async () => {
    return { success: true }
  })

  // ── GET /api/me ────────────────────────────────────────────────
  app.get("/api/me", { preHandler: app.authenticate }, async (request, reply) => {
    const userId = request.user?.userId
    if (!userId) {
      reply.status(401).send({ error: "Unauthorized", message: "Missing user context" })
      return
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        workspaceId: true,
      },
    })

    if (!user) {
      reply.status(404).send({ error: "Not Found", message: "User not found" })
      return
    }

    return user
  })
}

export default fp(authRoutes, { name: "auth-routes" })
