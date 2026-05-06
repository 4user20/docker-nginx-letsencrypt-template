# ── Stage 1: deps ────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ linux-headers

# Copy package files
COPY package.json pnpm-lock.yaml* npm-shrinkwrap.json* ./

# Install pnpm
RUN npm install -g pnpm@9

# Install dependencies
RUN pnpm install --frozen-lockfile --prod=false

# ── Stage 2: builder ────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY package.json pnpm-lock.yaml* npm-shrinkwrap.json* ./
COPY src ./src
COPY tsconfig.json ./

# Build application
RUN npm run build

# ── Stage 3: production ─────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache curl tini

# Install pnpm
RUN npm install -g pnpm@9

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Copy package files
COPY package.json pnpm-lock.yaml* npm-shrinkwrap.json* ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Set ownership
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Use tini as entrypoint
ENTRYPOINT ["tini", "--"]

# Start application
CMD ["node", "dist/server.js"]
