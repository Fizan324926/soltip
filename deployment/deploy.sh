#!/bin/bash

# SolTip Deployment Script
# Run this script as root on your VPS

set -e

echo "=================================="
echo "SolTip Deployment Script"
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
PORT=3050
NGINX_CONF="soltip"

# Auto-detect server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

if [ -z "$SERVER_IP" ]; then
    echo -e "${RED}Error: Could not auto-detect IP address${NC}"
    exit 1
fi

echo -e "${GREEN}Server IP: $SERVER_IP${NC}"
echo -e "${GREEN}Port: $PORT${NC}"
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

echo -e "${GREEN}✓ Dependencies ready${NC}"
echo ""

# Step 2: Install npm packages
echo -e "${YELLOW}Step 2: Installing npm packages...${NC}"
cd "$APP_DIR"

if [ ! -d "node_modules" ]; then
    npm install
fi

echo -e "${GREEN}✓ Packages installed${NC}"
echo ""

# Step 3: Build frontend
echo -e "${YELLOW}Step 3: Building frontend...${NC}"
npx vite build

if [ ! -d "dist" ]; then
    echo -e "${RED}Error: Frontend build failed - dist directory not created${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Frontend built successfully${NC}"
echo ""

# Step 4: Configure Nginx
echo -e "${YELLOW}Step 4: Configuring Nginx...${NC}"

cat > /etc/nginx/sites-available/$NGINX_CONF << EOF
server {
    listen $PORT;
    server_name $SERVER_IP;

    root $APP_DIR/dist;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # SPA routing - serve index.html for all routes
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
EOF

# Enable site
ln -sf /etc/nginx/sites-available/$NGINX_CONF /etc/nginx/sites-enabled/

# Test nginx configuration
nginx -t

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Nginx configuration test failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Nginx configured${NC}"
echo ""

# Step 5: Set permissions
echo -e "${YELLOW}Step 5: Setting permissions...${NC}"
chmod -R 755 "$APP_DIR/dist"
echo -e "${GREEN}✓ Permissions set${NC}"
echo ""

# Step 6: Start/restart Nginx
echo -e "${YELLOW}Step 6: Starting Nginx...${NC}"
systemctl restart nginx

if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx started${NC}"
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
echo -e "  ${GREEN}http://$SERVER_IP:$PORT${NC}"
echo ""
echo "Useful commands:"
echo "  - View logs: tail -f /var/log/nginx/soltip-access.log"
echo "  - View errors: tail -f /var/log/nginx/soltip-error.log"
echo "  - Update: bash $PROJECT_DIR/deployment/update.sh"
echo "  - Stop: bash $PROJECT_DIR/deployment/stop.sh"
echo ""
