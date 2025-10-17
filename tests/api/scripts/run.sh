#!/bin/bash
# Test runner shell script for the refactored API test suite

set -e

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_TEST_DIR="$(dirname "$SCRIPT_DIR")"

# Default environment
ENV=${1:-dev}

# Change to API test directory
cd "$API_TEST_DIR"

# Set environment variable
export TEST_ENV=$ENV

# Display environment info
echo "🌍 Test Environment: $TEST_ENV"
echo "📁 Test Directory: $API_TEST_DIR"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -q -r requirements.txt

# Check if API is running (for dev environment)
if [ "$ENV" = "dev" ]; then
    echo "🔍 Checking if API is running..."
    if ! curl -s http://localhost:8787/health > /dev/null; then
        echo "⚠️  API not running on localhost:8787"
        echo "💡 Start the API with: cd ../../api && npm run dev"
        echo ""
        echo "🔄 Continuing with tests anyway..."
    else
        echo "✅ API is running"
    fi
fi

# Safety checks for production
if [ "$ENV" = "prod" ]; then
    echo "⚠️  PRODUCTION MODE DETECTED"
    echo "🔒 This will run tests against production API"
    echo "🧹 Test data will be cleaned up automatically"
    echo ""
    
    # Ask for confirmation unless FORCE_PRODUCTION is set
    if [ -z "$FORCE_PRODUCTION" ]; then
        read -p "Are you sure you want to continue? (yes/no): " -r
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            echo "❌ Aborted by user"
            exit 1
        fi
    fi
fi

echo ""
echo "🚀 Running tests..."
echo ""

# Run tests based on environment
if [ "$ENV" = "prod" ]; then
    # In production, run only functional tests by default
    echo "🔒 Running functional tests only in production mode"
    python scripts/run_tests.py --env prod --readonly-only
else
    # In dev/staging, run all tests
    python scripts/run_tests.py --env "$ENV"
fi

echo ""
echo "✅ Tests completed!"
