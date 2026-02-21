#!/bin/bash

# SolTip Stop Script
# Removes the Nginx config and stops serving the project

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

NGINX_CONF="soltip"

echo "=================================="
echo "SolTip Stop Script"
echo "=================================="
echo ""

# Step 1: Remove Nginx site config
echo -e "${YELLOW}Removing Nginx configuration...${NC}"

if [ -f "/etc/nginx/sites-enabled/$NGINX_CONF" ]; then
    rm -f "/etc/nginx/sites-enabled/$NGINX_CONF"
    echo -e "${GREEN}✓ Site disabled${NC}"
else
    echo -e "${YELLOW}Site was not enabled${NC}"
fi

# Keep the config in sites-available for easy re-deploy
echo ""

# Step 2: Reload Nginx
echo -e "${YELLOW}Reloading Nginx...${NC}"
nginx -t 2>/dev/null

if systemctl is-active --quiet nginx; then
    systemctl reload nginx
    echo -e "${GREEN}✓ Nginx reloaded${NC}"
else
    echo -e "${YELLOW}Nginx is not running${NC}"
fi

echo ""
echo -e "${GREEN}=================================="
echo "SolTip Stopped"
echo "==================================${NC}"
echo ""
echo "The site is no longer being served."
echo "Config preserved at: /etc/nginx/sites-available/$NGINX_CONF"
echo "To redeploy: bash /root/domain-catcher/soltip/deployment/deploy.sh"
echo ""
