# Security Hardening

## Quick Wins
1. Change all default passwords in .env.example
2. Generate a strong JWT_SECRET: `openssl rand -base64 32`
3. Set restrictive file permissions on .env: `chmod 600 .env`
4. Enable automatic security updates on the host

## Nginx
- Review CSP headers for your specific frontend needs
- Adjust rate limits based on your traffic profile
- Test SSL configuration: `ssllabs.com/ssltest`

## Docker
- Keep base images updated
- Use specific image tags (not `latest`) in production
- Run containers with read-only root filesystem where possible
- Use Docker Content Trust for image verification

## PostgreSQL
- Use strong, unique passwords
- Configure backup retention
- Consider point-in-time recovery setup
