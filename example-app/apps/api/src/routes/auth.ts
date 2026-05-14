import { FastifyInstance } from "fastify"
import fp from "fastify-plugin"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { z } from "zod"
import { config } from "../config.js"
import { prisma } from "../server.js"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

async function authRoutes(app: FastifyInstance) {
  app.post("/api/auth/login", {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
  }, async (request, reply) => {
    const body = loginSchema.parse(request.body)

    const user = await prisma.user.findUnique({ where: { email: body.email } })
    if (!user) {
      reply.status(401).send({ error: "Unauthorized", message: "Invalid email or password" })
      return
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash)
    if (!valid) {
      reply.status(401).send({ error: "Unauthorized", message: "Invalid email or password" })
      return
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
    )

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    }
  })

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
        email: true,
        name: true,
        role: true,
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
