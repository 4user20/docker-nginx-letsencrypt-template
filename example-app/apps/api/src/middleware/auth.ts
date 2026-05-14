import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify"
import fp from "fastify-plugin"
import jwt from "jsonwebtoken"
import { config } from "../config.js"

interface JwtPayload {
  userId: string
  email: string
}

declare module "fastify" {
  interface FastifyRequest {
    user?: JwtPayload
  }
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

export async function authMiddleware(app: FastifyInstance) {
  app.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      reply.status(401).send({ error: "Unauthorized", message: "Missing or invalid authorization header" })
      return
    }

    const token = authHeader.slice(7)

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload
      request.user = decoded
    } catch {
      reply.status(401).send({ error: "Unauthorized", message: "Invalid or expired token" })
    }
  })
}

export default fp(authMiddleware, { name: "auth" })
