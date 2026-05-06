#!/bin/bash

# Let's Encrypt initialization script
# This script sets up SSL certificates for your domain

set -e

# Configuration
DOMAIN="${1:-yourdomain.com}"
EMAIL="${2:-your@email.com}"
STAGING="${3:-0}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Let's Encrypt SSL Certificate Setup${NC}"
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo "Staging: $STAGING"
echo ""

# Check if domain is provided
if [ "$DOMAIN" = "yourdomain.com" ]; then
    echo -e "${RED}Error: Please provide your domain as first argument${NC}"
    echo "Usage: ./init-letsencrypt.sh yourdomain.com your@email.com [staging]"
    exit 1
fi

# Create directories if they don't exist
echo -e "${YELLOW}Creating directories...${NC}"
mkdir -p certbot/conf
mkdir -p certbot/www

# Download recommended TLS parameters
echo -e "${YELLOW}Downloading TLS parameters...${NC}"
if [ ! -f certbot/conf/options-ssl-nginx.conf ]; then
    curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > certbot/conf/options-ssl-nginx.conf
fi

if [ ! -f certbot/conf/ssl-dhparams.pem ]; then
    curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/_internal/tls_configs/ssl-dhparams.pem > certbot/conf/ssl-dhparams.pem
fi

# Update nginx configuration with domain
echo -e "${YELLOW}Updating Nginx configuration...${NC}"
sed -i "s/yourdomain.com/$DOMAIN/g" nginx/conf.d/default.conf

# Start containers
echo -e "${YELLOW}Starting Docker containers...${NC}"
docker compose up -d nginx app postgres redis

# Wait for Nginx to be ready
echo -e "${YELLOW}Waiting for Nginx to be ready...${NC}"
sleep 5

# Request certificate
echo -e "${YELLOW}Requesting SSL certificate from Let's Encrypt...${NC}"

STAGING_FLAG=""
if [ "$STAGING" = "1" ]; then
    STAGING_FLAG="--staging"
    echo -e "${YELLOW}Using Let's Encrypt staging environment${NC}"
fi

docker compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    $STAGING_FLAG \
    -d "$DOMAIN" \
    -d "www.$DOMAIN"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Certificate successfully obtained!${NC}"
    
    # Reload Nginx with new certificate
    echo -e "${YELLOW}Reloading Nginx...${NC}"
    docker compose exec nginx nginx -s reload
    
    echo -e "${GREEN}SSL setup complete!${NC}"
    echo ""
    echo "Your site is now available at:"
    echo -e "${GREEN}https://$DOMAIN${NC}"
    echo -e "${GREEN}https://www.$DOMAIN${NC}"
    echo ""
    echo "Certificate will auto-renew every 12 hours."
else
    echo -e "${RED}Failed to obtain certificate${NC}"
    echo "Please check the error messages above."
    exit 1
fi
