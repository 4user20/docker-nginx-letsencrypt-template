# Docker Nginx Let's Encrypt Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                             │
│                                                              │
│  HTTPS (443) / HTTP (80)                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │   Nginx Reverse Proxy (1.25)       │
        │   - SSL/TLS Termination            │
        │   - Security Headers               │
        │   - Rate Limiting                  │
        │   - Gzip Compression               │
        │   - Static File Caching            │
        └────────────────┬───────────────────┘
                         │
        ┌────────────────┴───────────────────┐
        │                                    │
        ▼                                    ▼
┌──────────────────────┐          ┌──────────────────────┐
│  Node.js App         │          │  Certbot             │
│  (Fastify)           │          │  (Let's Encrypt)     │
│  - TypeScript        │          │  - Auto Renewal      │
│  - Health Checks     │          │  - Certificate Mgmt  │
│  - Metrics           │          │  - ACME Challenge    │
│  - API Endpoints     │          │                      │
└──────────┬───────────┘          └──────────────────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌──────────────┐ ┌──────────────┐
│ PostgreSQL   │ │ Redis        │
│ - Database   │ │ - Cache      │
│ - Persistence│ │ - Sessions   │
│ - Backups    │ │ - Queues     │
└──────────────┘ └──────────────┘
```

## Container Details

### Nginx Container
- **Image**: nginx:1.25-alpine
- **Ports**: 80 (HTTP), 443 (HTTPS)
- **Volumes**:
  - nginx.conf (read-only)
  - conf.d/ (read-only)
  - /etc/letsencrypt (read-only)
  - /var/www/certbot (read-only)
- **Memory Limit**: 256MB
- **CPU Limit**: 0.5 cores

**Responsibilities**:
- SSL/TLS termination
- HTTP to HTTPS redirect
- Reverse proxy to application
- Security headers injection
- Rate limiting
- Static file caching
- Request logging

### Application Container
- **Image**: Custom Node.js 20 Alpine
- **Port**: 3000 (internal)
- **Volumes**: None (stateless)
- **Memory Limit**: 1GB
- **CPU Limit**: 1.0 core

**Responsibilities**:
- API endpoints
- Business logic
- Health checks
- Metrics collection
- Database queries
- Redis caching

### PostgreSQL Container
- **Image**: postgres:15-alpine
- **Port**: 5432 (internal)
- **Volumes**: postgres_data (persistent)
- **Memory Limit**: 512MB
- **CPU Limit**: 0.5 cores

**Responsibilities**:
- Data persistence
- ACID transactions
- Query execution
- Backup storage

### Redis Container
- **Image**: redis:7-alpine
- **Port**: 6379 (internal)
- **Volumes**: redis_data (persistent)
- **Memory Limit**: 256MB
- **CPU Limit**: 0.25 cores

**Responsibilities**:
- Session storage
- Cache layer
- Queue management
- Real-time data

### Certbot Container
- **Image**: certbot/certbot:latest
- **Volumes**: 
  - /etc/letsencrypt (persistent)
  - /var/www/certbot (persistent)
- **Entrypoint**: Renewal loop (every 12 hours)

**Responsibilities**:
- Certificate generation
- Certificate renewal
- ACME challenge handling
- Certificate validation

## Network Architecture

```
┌─────────────────────────────────────────┐
│         Docker Network (internal)        │
│                                         │
│  ┌─────────────┐  ┌─────────────┐     │
│  │   Nginx     │  │   Certbot   │     │
│  │  :80, :443  │  │  (renewal)  │     │
│  └──────┬──────┘  └─────────────┘     │
│         │                              │
│         ▼                              │
│  ┌─────────────┐                      │
│  │   App       │                      │
│  │  :3000      │                      │
│  └──────┬──────┘                      │
│         │                              │
│    ┌────┴────┐                        │
│    │         │                        │
│    ▼         ▼                        │
│  ┌────────┐ ┌────────┐               │
│  │  PG    │ │ Redis  │               │
│  │ :5432  │ │ :6379  │               │
│  └────────┘ └────────┘               │
│                                       │
└─────────────────────────────────────────┘
```

## Data Flow

### Request Flow
```
1. Client Request (HTTPS)
   ↓
2. Nginx (SSL Termination)
   ↓
3. Security Headers Added
   ↓
4. Rate Limiting Check
   ↓
5. Proxy to App (HTTP)
   ↓
6. App Processing
   ├─ Check Redis Cache
   ├─ Query PostgreSQL if needed
   └─ Generate Response
   ↓
7. Response to Nginx
   ↓
8. Nginx Caching (if applicable)
   ↓
9. Response to Client (HTTPS)
```

### SSL Certificate Renewal Flow
```
1. Certbot Container (every 12 hours)
   ↓
2. Check Certificate Expiration
   ↓
3. If < 30 days to expiry:
   ├─ Generate ACME Challenge
   ├─ Nginx serves challenge
   ├─ Let's Encrypt validates
   └─ Certificate renewed
   ↓
4. Nginx reloads configuration
   ↓
5. New certificate active
```

## Security Architecture

### SSL/TLS
- **Protocol**: TLSv1.2, TLSv1.3
- **Ciphers**: HIGH:!aNULL:!MD5
- **HSTS**: max-age=31536000
- **Stapling**: OCSP stapling enabled

### Security Headers
```
Strict-Transport-Security: max-age=31536000
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### Rate Limiting
- **API**: 100 req/s per IP
- **Auth**: 60 req/min per IP
- **General**: 30 req/s per IP
- **Burst**: Allowed with nodelay

### Network Isolation
- All containers on internal network
- Only Nginx exposed to internet
- Database and Redis internal only
- No direct external access to app

## Persistence

### Volumes
- **postgres_data**: PostgreSQL data files
- **redis_data**: Redis persistence (AOF)
- **certbot/conf**: SSL certificates
- **certbot/www**: ACME challenge files

### Backup Strategy
```
Daily Backups:
├─ PostgreSQL dump
├─ Redis snapshot
└─ SSL certificates

Retention: 7 days
Location: /backups (mount external storage)
```

## Monitoring & Logging

### Health Checks
- **Nginx**: HTTP GET /health
- **App**: HTTP GET /health (checks DB + Redis)
- **PostgreSQL**: pg_isready
- **Redis**: redis-cli ping

### Logging
- **Nginx**: /var/log/nginx/access.log, error.log
- **App**: stdout (Docker logs)
- **PostgreSQL**: stdout (Docker logs)
- **Redis**: stdout (Docker logs)

### Metrics
- **Prometheus**: /metrics endpoint
- **Grafana**: Dashboard visualization
- **CloudWatch**: AWS integration (optional)

## Performance Optimization

### Caching Strategy
```
Static Files (CSS, JS, Images):
├─ Browser Cache: 30 days
├─ Nginx Cache: 30 days
└─ Gzip Compression: Enabled

API Responses:
├─ Redis Cache: 1 hour (configurable)
├─ Nginx Proxy Cache: 5 minutes
└─ Browser Cache: No-cache

Database Queries:
├─ Redis Cache: 1 hour
├─ Connection Pool: 10 connections
└─ Query Optimization: Indexes
```

### Resource Limits
```
Total System:
├─ Memory: 2.5 GB
├─ CPU: 2.25 cores
└─ Disk: Unlimited (mount external)

Per Container:
├─ Nginx: 256MB / 0.5 CPU
├─ App: 1GB / 1.0 CPU
├─ PostgreSQL: 512MB / 0.5 CPU
└─ Redis: 256MB / 0.25 CPU
```

## Scaling Considerations

### Horizontal Scaling
```
Load Balancer
    │
    ├─ App Instance 1
    ├─ App Instance 2
    └─ App Instance N

Shared:
├─ PostgreSQL (RDS)
├─ Redis (ElastiCache)
└─ Nginx (ALB)
```

### Vertical Scaling
- Increase container memory limits
- Increase CPU allocation
- Upgrade instance type
- Increase database resources

## Disaster Recovery

### RTO/RPO Targets
- **RTO**: < 15 minutes
- **RPO**: < 1 hour

### Recovery Procedures
1. **Container Failure**: Docker restart (automatic)
2. **Data Loss**: Restore from backup
3. **Certificate Expiry**: Certbot auto-renewal
4. **Complete Failure**: Redeploy from docker-compose

## Cost Estimation

### Monthly Costs (AWS)
| Component | Cost |
|-----------|------|
| EC2 Instance (t4g.micro) | $6.13 |
| EBS Volume (20GB) | $1.60 |
| Data Transfer | $0.50 |
| **Total** | **~$8.23** |

### Cost Optimization
- Use spot instances for non-critical
- Reserved instances for production
- S3 for backup storage
- CloudFront for static files

## References

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Fastify Documentation](https://www.fastify.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
