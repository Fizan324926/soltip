#!/bin/bash

# SolTip Update Script
# Rebuilds the frontend and reloads Nginx

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR="/root/domain-catcher/soltip"
APP_DIR="$PROJECT_DIR/app"
PORT=3050

echo "=================================="
echo "SolTip Update Script"
echo "=================================="
echo ""

# Step 1: Rebuild frontend
echo -e "${YELLOW}Rebuilding frontend...${NC}"
cd "$APP_DIR"

npm install --silent 2>/dev/null
npm run build 2>&1 || true

if [ ! -d "dist" ]; then
    echo -e "${RED}Error: Frontend build failed${NC}"
    exit 1
fi

chmod -R 755 "$APP_DIR/dist"
echo -e "${GREEN}✓ Frontend rebuilt${NC}"
echo ""

# Step 2: Reload Nginx
echo -e "${YELLOW}Reloading Nginx...${NC}"
nginx -t

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Nginx configuration test failed${NC}"
    exit 1
fi

systemctl reload nginx
echo -e "${GREEN}✓ Nginx reloaded${NC}"
echo ""

SERVER_IP=$(hostname -I | awk '{print $1}')

echo -e "${GREEN}Update Complete!${NC}"
echo -e "SolTip is live at: ${GREEN}http://$SERVER_IP:$PORT${NC}"
echo ""
