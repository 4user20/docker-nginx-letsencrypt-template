export interface ChecklistSeedItem {
  title: string
  description: string
  severity: string
  status: string
}

export interface ChecklistSeedTemplate {
  name: string
  category: string
  description: string
  items: ChecklistSeedItem[]
}

export const checklistSeedData: ChecklistSeedTemplate[] = [
  {
    name: "Docker Best Practices",
    category: "docker",
    description: "Verify Docker configuration follows production best practices",
    items: [
      { title: "Multi-stage build", description: "Use multi-stage builds to reduce final image size", severity: "high", status: "not_checked" },
      { title: "Non-root user", description: "Container should run as non-root user for security", severity: "high", status: "not_checked" },
      { title: "Healthcheck configured", description: "Dockerfile HEALTHCHECK instruction should be set", severity: "medium", status: "not_checked" },
      { title: ".dockerignore exists", description: "Exclude node_modules and build artifacts from context", severity: "medium", status: "not_checked" },
    ],
  },
  {
    name: "Nginx Configuration",
    category: "nginx",
    description: "Verify Nginx reverse proxy configuration",
    items: [
      { title: "Security headers", description: "Add X-Frame-Options, X-Content-Type-Options, HSTS headers", severity: "high", status: "not_checked" },
      { title: "Rate limiting", description: "Configure rate limiting to prevent abuse", severity: "high", status: "not_checked" },
      { title: "HTTPS redirect", description: "Redirect all HTTP traffic to HTTPS", severity: "high", status: "not_checked" },
      { title: "Deny hidden files", description: "Block access to .env, .git, and other hidden files", severity: "medium", status: "not_checked" },
    ],
  },
  {
    name: "CI/CD Pipeline",
    category: "cicd",
    description: "Verify continuous integration and deployment pipeline",
    items: [
      { title: "Lint and typecheck", description: "Run ESLint and TypeScript type checking", severity: "high", status: "not_checked" },
      { title: "Tests pass", description: "All unit and integration tests must pass", severity: "high", status: "not_checked" },
      { title: "Trivy vulnerability scan", description: "Scan Docker image for known vulnerabilities", severity: "high", status: "not_checked" },
    ],
  },
  {
    name: "Security Checklist",
    category: "security",
    description: "Verify application security measures",
    items: [
      { title: "No secrets in environment", description: "Use secrets manager or encrypted env files", severity: "high", status: "not_checked" },
      { title: "CORS configured", description: "Restrict CORS to known origins", severity: "medium", status: "not_checked" },
      { title: "Input validation", description: "Validate and sanitize all user inputs", severity: "high", status: "not_checked" },
      { title: "Authentication required", description: "All non-public endpoints require auth", severity: "high", status: "not_checked" },
    ],
  },
  {
    name: "Database Configuration",
    category: "database",
    description: "Verify database setup and configuration",
    items: [
      { title: "Migrations run", description: "Database schema is up to date with migrations", severity: "high", status: "not_checked" },
      { title: "Connection pooling", description: "Configure connection pool limits appropriately", severity: "medium", status: "not_checked" },
      { title: "Backups configured", description: "Automated database backups are set up", severity: "high", status: "not_checked" },
    ],
  },
  {
    name: "Observability",
    category: "observability",
    description: "Verify monitoring and logging setup",
    items: [
      { title: "Health endpoint", description: "Application has /health and /ready endpoints", severity: "medium", status: "not_checked" },
      { title: "Structured logging", description: "Use structured JSON logging in production", severity: "medium", status: "not_checked" },
      { title: "Metrics endpoint", description: "Expose Prometheus metrics at /metrics", severity: "low", status: "not_checked" },
    ],
  },
]
