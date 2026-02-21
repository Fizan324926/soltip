#!/bin/bash

# SolTip Full-Stack Deployment Script
# Deploys frontend (Nginx) + backend (Rust/Actix) + database (PostgreSQL)
# Run this script as root on your VPS

set -e

echo "=================================="
echo "SolTip Full-Stack Deployment"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
PROJECT_DIR="/root/domain-catcher/soltip"
APP_DIR="$PROJECT_DIR/app"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_PORT=3050
BACKEND_PORT=3051
NGINX_CONF="soltip"

# Auto-detect server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

if [ -z "$SERVER_IP" ]; then
    echo -e "${RED}Error: Could not auto-detect IP address${NC}"
    exit 1
fi

echo -e "${GREEN}Server IP: $SERVER_IP${NC}"
echo -e "${GREEN}Frontend Port: $FRONTEND_PORT${NC}"
echo -e "${GREEN}Backend Port: $BACKEND_PORT${NC}"
echo ""

# Step 1: Check dependencies
echo -e "${YELLOW}Step 1: Checking dependencies...${NC}"

if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    apt-get update && apt-get install -y nginx
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js not found. Please install Node.js first.${NC}"
    exit 1
fi

if ! command -v cargo &> /dev/null; then
    echo -e "${RED}Error: Rust/Cargo not found. Please install Rust first.${NC}"
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: PostgreSQL client not found. Please install PostgreSQL.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Dependencies ready${NC}"
echo ""

# Step 2: Set up database
echo -e "${YELLOW}Step 2: Setting up database...${NC}"

# Create user and database if they don't exist
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='soltip'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE USER soltip WITH PASSWORD 'soltip';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='soltip'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE soltip OWNER soltip;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE soltip TO soltip;" 2>/dev/null

echo -e "${GREEN}✓ Database ready${NC}"
echo ""

# Step 3: Build backend
echo -e "${YELLOW}Step 3: Building backend (this may take a few minutes)...${NC}"
cd "$BACKEND_DIR"

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    cat > .env << ENVEOF
DATABASE_URL=postgres://soltip:soltip@localhost:5432/soltip
DB_MAX_CONNECTIONS=10
SOLANA_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=BhynwWdN5g5S5FfCEgDovajaYQDq925S2Xs8vXas58uo
PLATFORM_AUTHORITY=
HOST=127.0.0.1
PORT=$BACKEND_PORT
CORS_ORIGINS=http://$SERVER_IP:$FRONTEND_PORT
JWT_SECRET=soltip-dev-secret-key-change-in-production-2026
AUTH_TOKEN_MAX_AGE_SECS=300
WEBHOOK_TIMEOUT_SECS=10
WEBHOOK_MAX_RETRIES=3
COINGECKO_API_KEY=
PRICE_CACHE_TTL_SECS=60
RUST_LOG=info,soltip_backend=debug
ENVEOF
fi

cargo build --release 2>&1

if [ ! -f "target/release/soltip-backend" ]; then
    echo -e "${RED}Error: Backend build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Backend built${NC}"
echo ""

# Step 4: Set up backend systemd service
echo -e "${YELLOW}Step 4: Setting up backend service...${NC}"

cat > /etc/systemd/system/soltip-backend.service << SVCEOF
[Unit]
Description=SolTip Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=$BACKEND_DIR
EnvironmentFile=$BACKEND_DIR/.env
ExecStart=$BACKEND_DIR/target/release/soltip-backend
Restart=on-failure
RestartSec=5
StandardOutput=append:/var/log/soltip-backend.log
StandardError=append:/var/log/soltip-backend-error.log

[Install]
WantedBy=multi-user.target
SVCEOF

systemctl daemon-reload
systemctl enable soltip-backend.service
systemctl restart soltip-backend.service
sleep 3

if systemctl is-active --quiet soltip-backend.service; then
    echo -e "${GREEN}✓ Backend service running on port $BACKEND_PORT${NC}"
else
    echo -e "${RED}Error: Backend service failed to start${NC}"
    echo "Check logs: journalctl -u soltip-backend.service -n 50"
    exit 1
fi
echo ""

# Step 5: Build frontend
echo -e "${YELLOW}Step 5: Building frontend...${NC}"
cd "$APP_DIR"

if [ ! -d "node_modules" ]; then
    npm install
fi

# Set API URL to same-origin proxy
echo "VITE_API_URL=http://$SERVER_IP:$FRONTEND_PORT/api/v1" > .env

npx vite build

if [ ! -d "dist" ]; then
    echo -e "${RED}Error: Frontend build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Frontend built${NC}"
echo ""

# Step 6: Configure Nginx (frontend + API proxy)
echo -e "${YELLOW}Step 6: Configuring Nginx...${NC}"

cat > /etc/nginx/sites-available/$NGINX_CONF << NGXEOF
server {
    listen $FRONTEND_PORT;
    server_name $SERVER_IP;

    root $APP_DIR/dist;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        proxy_buffering off;
    }

    # SPA routing
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Logging
    access_log /var/log/nginx/soltip-access.log;
    error_log /var/log/nginx/soltip-error.log;
}
NGXEOF

ln -sf /etc/nginx/sites-available/$NGINX_CONF /etc/nginx/sites-enabled/
nginx -t

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Nginx configuration test failed${NC}"
    exit 1
fi

chmod -R 755 "$APP_DIR/dist"
systemctl restart nginx

if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx configured and running${NC}"
else
    echo -e "${RED}Error: Nginx failed to start${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=================================="
echo "Deployment Complete!"
echo "==================================${NC}"
echo ""
echo -e "SolTip is now live at:"
echo -e "  Frontend: ${GREEN}http://$SERVER_IP:$FRONTEND_PORT${NC}"
echo -e "  API:      ${GREEN}http://$SERVER_IP:$FRONTEND_PORT/api/v1/health${NC}"
echo ""
echo "Useful commands:"
echo "  - Backend logs:  tail -f /var/log/soltip-backend.log"
echo "  - Backend errors: tail -f /var/log/soltip-backend-error.log"
echo "  - Nginx logs:    tail -f /var/log/nginx/soltip-access.log"
echo "  - Update:        bash $PROJECT_DIR/deployment/update.sh"
echo "  - Stop:          bash $PROJECT_DIR/deployment/stop.sh"
echo ""
