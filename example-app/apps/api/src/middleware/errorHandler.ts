import { FastifyInstance, FastifyError, FastifyReply, FastifyRequest } from "fastify"
import fp from "fastify-plugin"
import { ZodError } from "zod"

async function errorHandler(app: FastifyInstance) {
  app.setErrorHandler((error: FastifyError | ZodError, request: FastifyRequest, reply: FastifyReply) => {
    app.log.error(error)

    if (error instanceof ZodError) {
      reply.status(422).send({
        error: "Validation Error",
        message: "Request validation failed",
        statusCode: 422,
        fields: error.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      })
      return
    }

    const statusCode = (error as FastifyError).statusCode || 500
    const isProduction = process.env.NODE_ENV === "production"

    reply.status(statusCode).send({
      error: error.name || "Internal Server Error",
      message: isProduction ? "An unexpected error occurred" : error.message,
      statusCode,
    })
  })
}

export default fp(errorHandler)
