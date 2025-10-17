#!/bin/bash
#
# Seed database with access rules for existing content
#

API_KEY="d458ab3fede5cfefb6f33b8aa21cc93988052c020e59075b8bdc6d95b9847246"
BASE_URL="http://localhost:8787"

echo "🌱 Seeding database with access rules for existing content..."
echo ""

# Notes - all open except one
echo "📝 Creating access rules for notes..."
curl -s -X POST "$BASE_URL/api/internal/access-rules" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "notes",
    "slug": "physical-interfaces",
    "accessMode": "open",
    "description": "Public note about physical interfaces"
  }' | jq -r '.slug + " - " + .access_mode'

# Ideas - mix of access modes
echo "💡 Creating access rules for ideas..."
curl -s -X POST "$BASE_URL/api/internal/access-rules" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "ideas",
    "slug": "extending-carplay",
    "accessMode": "open",
    "description": "Public idea about CarPlay extensions"
  }' | jq -r '.slug + " - " + .access_mode'

curl -s -X POST "$BASE_URL/api/internal/access-rules" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "ideas",
    "slug": "local-first-ai",
    "accessMode": "password",
    "password": "ai-secret-2024",
    "description": "Password-protected AI idea"
  }' | jq -r '.slug + " - " + .access_mode'

curl -s -X POST "$BASE_URL/api/internal/access-rules" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "ideas",
    "slug": "sample-protected-idea",
    "accessMode": "password",
    "password": "ideas-sample-protected-idea-test123",
    "description": "Sample protected idea"
  }' | jq -r '.slug + " - " + .access_mode'

# Publications - email-list
echo "📄 Creating access rules for publications..."
curl -s -X POST "$BASE_URL/api/internal/access-rules" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "publications",
    "slug": "decisionrecord-io",
    "accessMode": "email-list",
    "description": "Email-restricted publication",
    "allowedEmails": ["subscriber@example.com", "admin@example.com"]
  }' | jq -r '.slug + " - " + .access_mode'

# Pages - all open
echo "📄 Creating access rules for pages..."
curl -s -X POST "$BASE_URL/api/internal/access-rules" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "pages",
    "slug": "about",
    "accessMode": "open",
    "description": "Public about page"
  }' | jq -r '.slug + " - " + .access_mode'

curl -s -X POST "$BASE_URL/api/internal/access-rules" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "pages",
    "slug": "contact",
    "accessMode": "open",
    "description": "Public contact page"
  }' | jq -r '.slug + " - " + .access_mode'

echo ""
echo "✅ Database seeded with access rules!"
echo ""
echo "📊 Summary:"
curl -s "$BASE_URL/api/content-catalog" \
  -H "X-API-Key: $API_KEY" \
  | jq -r '
    "Total rules: \(.totalCount)",
    "Open: \([.rules[] | select(.accessMode == "open")] | length)",
    "Password: \([.rules[] | select(.accessMode == "password")] | length)",
    "Email-list: \([.rules[] | select(.accessMode == "email-list")] | length)"
  '
