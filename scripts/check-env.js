#!/usr/bin/env node

/**
 * Environment Checker Script
 * 
 * Checks that all required environment variables are properly configured
 * for both local development and production environments.
 */

const fs = require('fs');
const path = require('path');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description}: ${filePath}`, 'green');
    return true;
  } else {
    log(`❌ ${description}: ${filePath} (missing)`, 'red');
    return false;
  }
}

function checkApiEnvironment() {
  log('\n🔧 API Environment Check', 'bold');
  log('=' .repeat(50), 'blue');
  
  const apiDir = path.join(__dirname, '..', 'api');
  const devVarsPath = path.join(apiDir, '.dev.vars');
  const localEnvPath = path.join(apiDir, '.env.local');
  const prodEnvPath = path.join(apiDir, '.env.production');
  const wranglerPath = path.join(apiDir, 'wrangler.toml');
  
  const checks = [
    checkFile(devVarsPath, 'Local dev vars (.dev.vars)'),
    checkFile(localEnvPath, 'Local environment (.env.local)'),
    checkFile(prodEnvPath, 'Production environment (.env.production)'),
    checkFile(wranglerPath, 'Wrangler configuration (wrangler.toml)')
  ];
  
  // Check if .dev.vars has required variables
  if (fs.existsSync(devVarsPath)) {
    const content = fs.readFileSync(devVarsPath, 'utf8');
    const requiredVars = ['JWT_SECRET', 'INTERNAL_API_KEY', 'CONTENT_PASSWORD'];
    
    log('\n📋 Required variables in .dev.vars:', 'blue');
    requiredVars.forEach(varName => {
      if (content.includes(varName)) {
        log(`  ✅ ${varName}`, 'green');
      } else {
        log(`  ❌ ${varName} (missing)`, 'red');
      }
    });
  }
  
  return checks.every(Boolean);
}

function checkFrontendEnvironment() {
  log('\n🌐 Frontend Environment Check', 'bold');
  log('=' .repeat(50), 'blue');
  
  const webDir = path.join(__dirname, '..', 'web');
  const localEnvPath = path.join(webDir, '.env.local');
  const prodEnvPath = path.join(webDir, '.env.production');
  const envPath = path.join(webDir, '.env');
  
  const checks = [
    checkFile(localEnvPath, 'Local environment (.env.local)'),
    checkFile(prodEnvPath, 'Production environment (.env.production)'),
    checkFile(envPath, 'Default environment (.env)')
  ];
  
  // Check if .env.local has required variables
  if (fs.existsSync(localEnvPath)) {
    const content = fs.readFileSync(localEnvPath, 'utf8');
    const requiredVars = ['VITE_API_BASE_URL', 'VITE_DEV_MODE', 'BUILD_API_KEY', 'BUILD_API_URL'];
    
    log('\n📋 Required variables in .env.local:', 'blue');
    requiredVars.forEach(varName => {
      if (content.includes(varName)) {
        log(`  ✅ ${varName}`, 'green');
      } else {
        log(`  ❌ ${varName} (missing)`, 'red');
      }
    });
  }
  
  return checks.every(Boolean);
}

function checkProductionSecrets() {
  log('\n🔐 Production Secrets Check', 'bold');
  log('=' .repeat(50), 'blue');
  
  log('To check production secrets, run:', 'yellow');
  log('  npx wrangler secret list', 'blue');
  log('\nRequired production secrets:', 'blue');
  log('  - JWT_SECRET', 'yellow');
  log('  - INTERNAL_API_KEY', 'yellow');
  log('  - CONTENT_PASSWORD', 'yellow');
}

function main() {
  log('🚀 Web Presence Environment Checker', 'bold');
  log('=' .repeat(50), 'blue');
  
  const apiOk = checkApiEnvironment();
  const frontendOk = checkFrontendEnvironment();
  checkProductionSecrets();
  
  log('\n📊 Summary', 'bold');
  log('=' .repeat(50), 'blue');
  
  if (apiOk && frontendOk) {
    log('✅ All environment files are properly configured!', 'green');
    log('\nYou can now run:', 'blue');
    log('  npm run dev:api    # Start API server', 'yellow');
    log('  npm run dev:web    # Start frontend server', 'yellow');
    log('  npm run test:quick # Run quick tests', 'yellow');
  } else {
    log('❌ Some environment files are missing or incomplete', 'red');
    log('\nPlease check the missing files and try again.', 'yellow');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkApiEnvironment, checkFrontendEnvironment };
