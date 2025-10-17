#!/usr/bin/env node

/**
 * E2E Test Runner Script
 * 
 * This script provides different options for running E2E tests
 * with various configurations and reporting options.
 */

const { execSync } = require('child_process');
const path = require('path');

const testSuites = {
  'api': 'tests/e2e/api-health.spec.ts tests/e2e/access-control.spec.ts',
  'frontend': 'tests/e2e/frontend-navigation.spec.ts tests/e2e/protected-content.spec.ts tests/e2e/content-rendering.spec.ts',
  'integration': 'tests/e2e/full-integration.spec.ts',
  'error': 'tests/e2e/error-handling.spec.ts',
  'all': 'tests/e2e/'
};

const browsers = ['chromium', 'firefox', 'webkit', 'Mobile Chrome', 'Mobile Safari'];

function runCommand(command) {
  try {
    console.log(`Running: ${command}`);
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
  } catch (error) {
    console.error(`Command failed: ${command}`);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
E2E Test Runner

Usage: node scripts/test-e2e.js [options]

Options:
  --suite <name>     Run specific test suite (api, frontend, integration, error, all)
  --browser <name>   Run tests on specific browser (chromium, firefox, webkit, "Mobile Chrome", "Mobile Safari")
  --api-only         Use API-only configuration (safer, no frontend dependencies)
  --ui              Run tests with UI mode
  --headed          Run tests in headed mode (see browser)
  --debug           Run tests in debug mode
  --report          Show test report
  --list            List all available tests
  --help            Show this help message

Examples:
  node scripts/test-e2e.js --suite api --api-only
  node scripts/test-e2e.js --suite all --browser chromium
  node scripts/test-e2e.js --ui
  node scripts/test-e2e.js --debug --browser firefox
  node scripts/test-e2e.js --report

Available test suites:
  ${Object.keys(testSuites).join(', ')}

Available browsers:
  ${browsers.join(', ')}
`);
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.length === 0) {
    showHelp();
    return;
  }

  let command = 'npx playwright test';
  let configFile = null;
  let suite = 'all';
  let browser = null;
  let ui = false;
  let headed = false;
  let debug = false;
  let report = false;
  let list = false;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--suite':
        suite = args[++i];
        break;
      case '--browser':
        browser = args[++i];
        break;
      case '--ui':
        ui = true;
        break;
      case '--headed':
        headed = true;
        break;
      case '--debug':
        debug = true;
        break;
      case '--report':
        report = true;
        break;
      case '--list':
        list = true;
        break;
      case '--api-only':
        configFile = 'playwright.api.config.ts';
        break;
    }
  }

  // Handle special commands
  if (report) {
    runCommand('npx playwright show-report');
    return;
  }

  if (list) {
    runCommand('npx playwright test --list');
    return;
  }

  // Validate suite
  if (!testSuites[suite]) {
    console.error(`Invalid test suite: ${suite}`);
    console.error(`Available suites: ${Object.keys(testSuites).join(', ')}`);
    process.exit(1);
  }

  // Validate browser
  if (browser && !browsers.includes(browser)) {
    console.error(`Invalid browser: ${browser}`);
    console.error(`Available browsers: ${browsers.join(', ')}`);
    process.exit(1);
  }

  // Build command
  if (testSuites[suite] !== 'tests/e2e/') {
    command += ` ${testSuites[suite]}`;
  }

  if (configFile) {
    command += ` --config=${configFile}`;
  }

  if (browser) {
    command += ` --project=${browser}`;
  }

  if (ui) {
    command += ' --ui';
  } else if (headed) {
    command += ' --headed';
  } else if (debug) {
    command += ' --debug';
  } else {
    command += ' --reporter=line';
  }

  console.log(`Running E2E tests: ${suite}${browser ? ` on ${browser}` : ''}`);
  runCommand(command);
}

if (require.main === module) {
  main();
}

module.exports = { runCommand, testSuites, browsers };
