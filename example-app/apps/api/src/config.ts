export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  host: process.env.HOST || "0.0.0.0",
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: process.env.JWT_SECRET || "change-me-in-production-demo-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "24h",
  appVersion: process.env.APP_VERSION || "1.0.0",
  gitSha: process.env.GIT_SHA || "",
  nodeEnv: process.env.NODE_ENV || "development",
  redisUrl: process.env.REDIS_URL || "",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
}
