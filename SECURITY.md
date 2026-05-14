# Security

## Template Scope
This Docker Compose template shows deployment patterns for small MVP projects. It includes basic hardening but is not a substitute for a production security review.

## Before Production Use
1. Change all default secrets in .env
2. Configure proper SSL certificates (Let's Encrypt)
3. Restrict SSH access on the host (not managed by Docker)
4. Review and adjust rate limits for your traffic patterns
5. Set appropriate CSP headers for your frontend
6. Run automated security scanning (Trivy, etc.)
7. Configure log rotation and monitoring
8. Set up regular backup procedures for PostgreSQL volumes
9. Keep all base images updated (Docker, Nginx, PostgreSQL, Redis)
10. Review Docker Compose security documentation

## Network Security
- PostgreSQL and Redis are only exposed on the internal Docker network
- Only Nginx ports (80, 443) are exposed to the host
- Health endpoints do not leak sensitive data

## Secrets Management
- Never commit .env files to version control
- Use Docker secrets or an external vault for production
- JWT_SECRET in .env.example is a placeholder - generate a strong random value
