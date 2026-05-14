# Docker Nginx Let's Encrypt Template

Docker Compose + Nginx template for deploying small MVPs on a VPS with HTTPS via Let's Encrypt.

## Architecture

```
Internet
    │
    ▼
Nginx :80/:443 (SSL Let's Encrypt)
    │
    ├── Node.js App :3000
    ├── PostgreSQL :5432
    └── Redis :6379
```

## Prerequisites

- Docker >= 20.10
- Docker Compose >= 2.0
- Domain name pointing to your server

## Quick Start

```bash
git clone https://github.com/yourusername/docker-nginx-letsencrypt-template.git
cd docker-nginx-letsencrypt-template
cp .env.example .env
# Edit .env with your domain and email
docker compose up -d
docker compose ps
docker compose logs -f
```

## Configuration

### Environment Variables

```env
# Application
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@postgres:5432/db
POSTGRES_PASSWORD=your-secure-password

# Redis
REDIS_URL=redis://redis:6379

# SSL
DOMAIN=yourdomain.com
EMAIL=your@email.com
```

## Security Headers

Basic security headers included:

```nginx
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=31536000
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

These are reasonable defaults for an MVP. Adapt them to your application's specific needs before production use.

## Rate Limiting

- **API endpoints**: 100 requests/second
- **Auth endpoints**: 60 requests/minute
- **Customizable** per location block

## Health Checks

- `/health` - Application health
- `/metrics` - Application metrics

## Testing

```bash
# Test Nginx configuration
docker compose exec nginx nginx -t

# Health check
curl https://yourdomain.com/health
```

## SSL Certificate Renewal

Certificates auto-renew via cron:

```bash
# Manual renewal
docker compose run --rm certbot renew

# Reload Nginx
docker compose exec nginx nginx -s reload
```

## Limitations

- This is a portfolio/starter template, not a production-hardened deployment.
- No A+ SSL rating has been tested on this template.
- No uptime guarantees are implied or tested.
- Rate limits and security headers are basic defaults — adapt them before production use.
- This is a single-server setup; no clustering, load balancing, or HA is included.

## Portfolio

This repository is part of a DevOps portfolio demonstrating Docker Compose, Nginx, and HTTPS deployment patterns for small MVP projects.

I use this template as a base for small MVP deployments on VPS: Docker Compose stack, Nginx reverse proxy, HTTPS/Let's Encrypt flow, PostgreSQL/Redis, healthchecks, logs, and basic hardening. It is a practical starting point that I adapt to each project's specific requirements.

## License

MIT License
