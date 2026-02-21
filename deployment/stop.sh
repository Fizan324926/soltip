#!/bin/bash

# SolTip Stop Script
# Stops the backend service and removes the Nginx site config

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

NGINX_CONF="soltip"

echo "=================================="
echo "SolTip Stop Script"
echo "=================================="
echo ""

# Step 1: Stop backend service
echo -e "${YELLOW}Stopping backend service...${NC}"

if systemctl is-active --quiet soltip-backend.service; then
    systemctl stop soltip-backend.service
    echo -e "${GREEN}✓ Backend service stopped${NC}"
else
    echo -e "${YELLOW}Backend service was not running${NC}"
fi
echo ""

# Step 2: Remove Nginx site config
echo -e "${YELLOW}Removing Nginx configuration...${NC}"

if [ -f "/etc/nginx/sites-enabled/$NGINX_CONF" ]; then
    rm -f "/etc/nginx/sites-enabled/$NGINX_CONF"
    echo -e "${GREEN}✓ Site disabled${NC}"
else
    echo -e "${YELLOW}Site was not enabled${NC}"
fi
echo ""

# Step 3: Reload Nginx
echo -e "${YELLOW}Reloading Nginx...${NC}"

if systemctl is-active --quiet nginx; then
    nginx -t 2>/dev/null && systemctl reload nginx
    echo -e "${GREEN}✓ Nginx reloaded${NC}"
else
    echo -e "${YELLOW}Nginx is not running${NC}"
fi

echo ""
echo -e "${GREEN}=================================="
echo "SolTip Stopped"
echo "==================================${NC}"
echo ""
echo "Both frontend and backend are stopped."
echo "Config preserved at: /etc/nginx/sites-available/$NGINX_CONF"
echo "To redeploy: bash /root/domain-catcher/soltip/deployment/deploy.sh"
echo ""
