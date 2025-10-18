#!/bin/bash
#
# R2 Bucket Setup Script
#
# Creates all required R2 buckets for development and production environments
#

set -e

echo "🚀 Setting up R2 buckets for Web Presence"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if bucket exists
check_bucket_exists() {
    local bucket_name=$1
    npx wrangler r2 bucket list | grep -q "$bucket_name" 2>/dev/null
}

# Function to create bucket if it doesn't exist
create_bucket_if_missing() {
    local bucket_name=$1
    local description=$2
    
    if check_bucket_exists "$bucket_name"; then
        echo -e "${YELLOW}⚠️  Bucket '$bucket_name' already exists${NC}"
    else
        echo -e "${YELLOW}📦 Creating bucket '$bucket_name'...${NC}"
        if npx wrangler r2 bucket create "$bucket_name"; then
            echo -e "${GREEN}✅ Created bucket '$bucket_name' - $description${NC}"
        else
            echo -e "${RED}❌ Failed to create bucket '$bucket_name'${NC}"
            exit 1
        fi
    fi
}

echo ""
echo "🔍 Checking existing buckets..."
npx wrangler r2 bucket list

echo ""
echo "📦 Creating development buckets..."

# Development buckets
create_bucket_if_missing "web-presence-dev-protected" "Development protected content storage"
create_bucket_if_missing "web-presence-dev-public" "Development public content storage"

echo ""
echo "📦 Creating production buckets..."

# Production buckets
create_bucket_if_missing "protected-content" "Production protected content storage"
create_bucket_if_missing "public-content" "Production public content storage"

echo ""
echo "🔍 Verifying all buckets exist..."

# Verify all buckets
ALL_BUCKETS=(
    "web-presence-dev-protected"
    "web-presence-dev-public"
    "protected-content"
    "public-content"
)

MISSING_BUCKETS=()

for bucket in "${ALL_BUCKETS[@]}"; do
    if check_bucket_exists "$bucket"; then
        echo -e "${GREEN}✅ $bucket${NC}"
    else
        echo -e "${RED}❌ $bucket${NC}"
        MISSING_BUCKETS+=("$bucket")
    fi
done

echo ""
if [ ${#MISSING_BUCKETS[@]} -eq 0 ]; then
    echo -e "${GREEN}🎉 All R2 buckets are set up correctly!${NC}"
    echo ""
    echo "📋 Bucket Summary:"
    echo "  Development:"
    echo "    - web-presence-dev-protected (protected content)"
    echo "    - web-presence-dev-public (public content)"
    echo "  Production:"
    echo "    - protected-content (protected content)"
    echo "    - public-content (public content)"
    echo ""
    echo "🚀 You can now run:"
    echo "  - Local development: npm run dev"
    echo "  - Production deployment: npm run deploy"
else
    echo -e "${RED}❌ Some buckets are missing:${NC}"
    for bucket in "${MISSING_BUCKETS[@]}"; do
        echo -e "${RED}  - $bucket${NC}"
    done
    exit 1
fi
