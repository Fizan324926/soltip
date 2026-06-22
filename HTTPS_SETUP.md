# HTTPS/SSL Setup Guide

## Option 1: Let's Encrypt (Recommended for Production)

### Prerequisites
- Domain name pointing to your server (e.g., soltip.io)
- Port 80 and 443 open

### Installation

```bash
# Install certbot
apt update
apt install certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d soltip.io -d www.soltip.io

# Auto-renewal is set up automatically
# Test with:
certbot renew --dry-run
```

### Nginx Configuration (with SSL)

```nginx
server {
    listen 80;
    server_name soltip.io www.soltip.io;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name soltip.io www.soltip.io;

    ssl_certificate /etc/letsencrypt/live/soltip.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/soltip.io/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Modern TLS configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    root /var/www/soltip/dist;
    index index.html;

    # Frontend SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Option 2: Cloudflare (Free SSL)

1. Add your domain to Cloudflare
2. Update nameservers at your registrar
3. Enable "Full (strict)" SSL mode
4. Cloudflare provides free SSL automatically

### Cloudflare Benefits
- Free SSL certificate
- DDoS protection
- CDN caching
- Web Application Firewall

## Option 3: Self-Signed Certificate (Development Only)

```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/soltip.key \
  -out /etc/ssl/certs/soltip.crt \
  -subj "/CN=localhost/O=SolTip/C=US"

# Update nginx to use it
ssl_certificate /etc/ssl/certs/soltip.crt;
ssl_certificate_key /etc/ssl/private/soltip.key;
```

**Warning**: Browsers will show security warnings for self-signed certs.

## Testing SSL Configuration

```bash
# Test with SSL Labs
https://www.ssllabs.com/ssltest/analyze.html?d=soltip.io

# Or use testssl.sh
docker run --rm -ti drwetter/testssl.sh https://soltip.io
```

## Troubleshooting

### Certificate not renewing
```bash
certbot renew --force-renewal
systemctl reload nginx
```

### Mixed content errors
Ensure all assets use HTTPS or protocol-relative URLs (`//`).

### WebSocket not working
Add to nginx:
```nginx
location /ws {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```
