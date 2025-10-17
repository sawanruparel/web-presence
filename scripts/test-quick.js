#!/usr/bin/env node

/**
 * Quick Test Script
 * 
 * Runs a minimal set of tests to verify the API is working
 * without overwhelming the system.
 */

const { execSync } = require('child_process');

function runQuickTest() {
  console.log('🚀 Running quick API health check...');
  
  try {
    // Test just the health endpoint with a single browser
    const command = 'npx playwright test tests/e2e/api-health.spec.ts --config=playwright.api.config.ts --project=chromium --reporter=line';
    console.log(`Running: ${command}`);
    
    execSync(command, { 
      stdio: 'inherit', 
      cwd: process.cwd(),
      timeout: 30000 // 30 second timeout
    });
    
    console.log('✅ Quick test completed successfully!');
  } catch (error) {
    console.error('❌ Quick test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runQuickTest();
}

module.exports = { runQuickTest };
