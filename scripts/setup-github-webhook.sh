#!/bin/bash

# GitHub Webhook Setup Script
# This script helps set up the GitHub webhook for content sync

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}GitHub Webhook Setup Script${NC}"
echo "================================"

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed${NC}"
    echo "Please install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}Error: Not authenticated with GitHub CLI${NC}"
    echo "Please run: gh auth login"
    exit 1
fi

# Get repository info
REPO=$(gh repo view --json name,owner -q '.owner.login + "/" + .name')
echo -e "${GREEN}Repository:${NC} $REPO"

# Get webhook secret from .dev.vars
if [ -f "api/.dev.vars" ]; then
    WEBHOOK_SECRET=$(grep "GITHUB_WEBHOOK_SECRET=" api/.dev.vars | cut -d'=' -f2)
    echo -e "${GREEN}Webhook Secret:${NC} $WEBHOOK_SECRET"
else
    echo -e "${RED}Error: api/.dev.vars file not found${NC}"
    exit 1
fi

# Prompt for API URL
echo ""
echo -e "${YELLOW}Enter your API URL:${NC}"
echo "For local development: http://localhost:8787"
echo "For production: https://your-api.workers.dev"
read -p "API URL: " API_URL

if [ -z "$API_URL" ]; then
    echo -e "${RED}Error: API URL is required${NC}"
    exit 1
fi

# Validate URL
if [[ ! $API_URL =~ ^https?:// ]]; then
    echo -e "${RED}Error: Invalid URL format. Must start with http:// or https://${NC}"
    exit 1
fi

# Check if localhost (not supported by GitHub)
if [[ $API_URL == *"localhost"* ]]; then
    echo -e "${YELLOW}Warning: GitHub doesn't support localhost URLs for webhooks${NC}"
    echo "You can:"
    echo "1. Use ngrok to expose your local server: ngrok http 8787"
    echo "2. Deploy to production first and use the production URL"
    echo "3. Test manually using the manual sync endpoint"
    echo ""
    read -p "Do you want to continue anyway? (y/N): " CONTINUE
    if [[ ! $CONTINUE =~ ^[Yy]$ ]]; then
        echo "Exiting..."
        exit 0
    fi
fi

# Create webhook
echo ""
echo -e "${GREEN}Creating webhook...${NC}"

WEBHOOK_URL="$API_URL/api/internal/content-sync/webhook"

# Create the webhook using GitHub CLI
gh api repos/$REPO/hooks -X POST \
  -f name="web-presence-content-sync" \
  -f "config[url]=$WEBHOOK_URL" \
  -f "config[content_type]=json" \
  -f "config[secret]=$WEBHOOK_SECRET" \
  -f "events[]=push" \
  -f "active=true"

echo -e "${GREEN}✅ Webhook created successfully!${NC}"
echo ""
echo -e "${GREEN}Webhook Details:${NC}"
echo "  URL: $WEBHOOK_URL"
echo "  Secret: $WEBHOOK_SECRET"
echo "  Events: push"
echo "  Active: true"
echo ""

# Test the webhook
echo -e "${YELLOW}Testing webhook...${NC}"
echo "You can test the webhook by:"
echo "1. Making a push to the main branch with content changes"
echo "2. Using the manual sync endpoint:"
echo "   curl -X POST $API_URL/api/internal/content-sync/manual \\"
echo "     -H 'X-API-Key: YOUR_API_KEY' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"full_sync\": true}'"
echo ""

# Show webhook management commands
echo -e "${GREEN}Webhook Management:${NC}"
echo "  List webhooks: gh api repos/$REPO/hooks"
echo "  Delete webhook: gh api repos/$REPO/hooks/WEBHOOK_ID -X DELETE"
echo "  Test webhook: gh api repos/$REPO/hooks/WEBHOOK_ID/pings -X POST"
