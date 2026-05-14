import pino from "pino"
import { config } from "./config.js"

const transport = config.nodeEnv === "development"
  ? { target: "pino-pretty", options: { colorize: true } }
  : undefined

export const logger = pino({
  level: config.nodeEnv === "production" ? "info" : "debug",
  transport,
})
