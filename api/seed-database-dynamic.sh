#!/bin/bash
#
# Dynamic Seed Database Script
# 
# Seeds database with access rules based on actual content files.
# This script reads from seed-config.json which is generated from
# the actual content files, ensuring perfect alignment.
#

# Configuration
# Read API key from environment variable or .dev.vars file
if [ -z "$API_KEY" ]; then
    if [ -f ".dev.vars" ]; then
        API_KEY=$(grep "INTERNAL_API_KEY=" .dev.vars | cut -d'=' -f2)
    else
        echo "❌ API_KEY environment variable not set and .dev.vars file not found"
        echo "Set API_KEY environment variable or ensure .dev.vars exists with INTERNAL_API_KEY"
        exit 1
    fi
fi

# Read base URL from environment variable or use default
BASE_URL="${API_BASE_URL:-http://localhost:8787}"
CONFIG_FILE="scripts/content-config.json"

echo "🌱 Dynamic Database Seeding"
echo "=========================="
echo ""

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Configuration file not found: $CONFIG_FILE"
    echo "Run 'node scripts/generate-seed-config.js' first to generate the configuration."
    exit 1
fi

# Check if API is running
echo "🔍 Checking API availability..."
if ! curl -s "$BASE_URL/api/content-catalog" -H "X-API-Key: $API_KEY" > /dev/null; then
    echo "❌ API is not running or not accessible at $BASE_URL"
    echo "Start the API with: npm run dev"
    exit 1
fi
echo "✅ API is running"

# Get current rule count
CURRENT_COUNT=$(curl -s "$BASE_URL/api/content-catalog" -H "X-API-Key: $API_KEY" | jq -r '.totalCount')
echo "📊 Current database rules: $CURRENT_COUNT"

# Read configuration
echo "📖 Reading configuration from $CONFIG_FILE..."
RULES_COUNT=$(jq -r '.rules | length' "$CONFIG_FILE")
echo "📋 Rules to create: $RULES_COUNT"

if [ "$RULES_COUNT" -eq 0 ]; then
    echo "⚠️  No rules to create. Exiting."
    exit 0
fi

echo ""
echo "🚀 Creating access rules..."

# Create rules from configuration
SUCCESS_COUNT=0
FAILED_COUNT=0

# Process each rule
jq -r '.rules[] | "\(.type)|\(.slug)|\(.accessMode)|\(.description)|\(.password // "null")|\(.allowedEmails // "null")"' "$CONFIG_FILE" | while IFS='|' read -r type slug accessMode description password allowedEmails; do
    echo "  Creating $type/$slug ($accessMode)..."
    
    # Build JSON payload
    JSON_PAYLOAD="{\"type\":\"$type\",\"slug\":\"$slug\",\"accessMode\":\"$accessMode\",\"description\":\"$description\""
    
    # Add password if provided
    if [ "$password" != "null" ]; then
        JSON_PAYLOAD="$JSON_PAYLOAD,\"password\":\"$password\""
    fi
    
    # Add allowed emails if provided
    if [ "$allowedEmails" != "null" ]; then
        # Convert array to JSON format
        EMAILS_JSON=$(echo "$allowedEmails" | jq -r 'join(",")')
        JSON_PAYLOAD="$JSON_PAYLOAD,\"allowedEmails\":[$EMAILS_JSON]"
    fi
    
    JSON_PAYLOAD="$JSON_PAYLOAD}"
    
    # Create the rule
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/internal/access-rules" \
        -H "X-API-Key: $API_KEY" \
        -H "Content-Type: application/json" \
        -d "$JSON_PAYLOAD")
    
    # Check if creation was successful
    if echo "$RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
        echo "    ✅ Created successfully"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    elif echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
        ERROR_MESSAGE=$(echo "$RESPONSE" | jq -r '.message // "Unknown error"')
        if echo "$ERROR_MESSAGE" | grep -q "already exists"; then
            echo "    ⚠️  Already exists (skipping)"
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        else
            echo "    ❌ Failed: $ERROR_MESSAGE"
            FAILED_COUNT=$((FAILED_COUNT + 1))
        fi
    else
        echo "    ❌ Failed: $(echo "$RESPONSE" | jq -r '.message // "Unknown error"')"
        FAILED_COUNT=$((FAILED_COUNT + 1))
    fi
done

echo ""
echo "📊 Seeding Summary:"
echo "  ✅ Successfully created: $SUCCESS_COUNT"
echo "  ❌ Failed to create: $FAILED_COUNT"

# Verify final state
echo ""
echo "🔍 Verifying final state..."
FINAL_COUNT=$(curl -s "$BASE_URL/api/content-catalog" -H "X-API-Key: $API_KEY" | jq -r '.totalCount')
echo "📊 Final database rules: $FINAL_COUNT"

# Show breakdown by access mode
echo ""
echo "📋 Access Mode Breakdown:"
curl -s "$BASE_URL/api/content-catalog" -H "X-API-Key: $API_KEY" | jq -r '
    "  Open: \([.rules[] | select(.accessMode == "open")] | length)",
    "  Password: \([.rules[] | select(.accessMode == "password")] | length)",
    "  Email-list: \([.rules[] | select(.accessMode == "email-list")] | length)"
'

if [ "$FINAL_COUNT" -eq "$RULES_COUNT" ]; then
    echo ""
    echo "✅ Database seeding completed successfully!"
    echo "   Database rules now match content files exactly."
else
    echo ""
    echo "⚠️  Warning: Rule count mismatch"
    echo "   Expected: $RULES_COUNT, Actual: $FINAL_COUNT"
fi
