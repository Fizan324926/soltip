#!/bin/bash

# SolTip Update Script
# Rebuilds frontend + backend and restarts services

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR="/root/domain-catcher/soltip"
APP_DIR="$PROJECT_DIR/app"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_PORT=3050
BACKEND_PORT=3051
SERVER_IP=$(hostname -I | awk '{print $1}')

echo "=================================="
echo "SolTip Update Script"
echo "=================================="
echo ""

# Step 1: Rebuild backend
echo -e "${YELLOW}Rebuilding backend...${NC}"
cd "$BACKEND_DIR"
cargo build --release 2>&1

if [ ! -f "target/release/soltip-backend" ]; then
    echo -e "${RED}Error: Backend build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Backend rebuilt${NC}"
echo ""

# Step 2: Restart backend service
echo -e "${YELLOW}Restarting backend service...${NC}"
systemctl restart soltip-backend.service
sleep 3

if systemctl is-active --quiet soltip-backend.service; then
    echo -e "${GREEN}✓ Backend service restarted${NC}"
else
    echo -e "${RED}Error: Backend service failed to restart${NC}"
    echo "Check logs: journalctl -u soltip-backend.service -n 50"
    exit 1
fi
echo ""

# Step 3: Rebuild frontend
echo -e "${YELLOW}Rebuilding frontend...${NC}"
cd "$APP_DIR"
npm install --silent 2>/dev/null

# Ensure API URL points to same-origin proxy
echo "VITE_API_URL=http://$SERVER_IP:$FRONTEND_PORT/api/v1" > .env

npx vite build

if [ ! -d "dist" ]; then
    echo -e "${RED}Error: Frontend build failed${NC}"
    exit 1
fi

chmod -R 755 "$APP_DIR/dist"
echo -e "${GREEN}✓ Frontend rebuilt${NC}"
echo ""

# Step 4: Reload Nginx
echo -e "${YELLOW}Reloading Nginx...${NC}"
nginx -t

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Nginx configuration test failed${NC}"
    exit 1
fi

systemctl reload nginx
echo -e "${GREEN}✓ Nginx reloaded${NC}"
echo ""

echo -e "${GREEN}Update Complete!${NC}"
echo -e "SolTip is live at: ${GREEN}http://$SERVER_IP:$FRONTEND_PORT${NC}"
echo -e "API health:        ${GREEN}http://$SERVER_IP:$FRONTEND_PORT/api/v1/health${NC}"
echo ""
