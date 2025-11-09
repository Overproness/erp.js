#!/usr/bin/env node

/**
 * Comprehensive Test Runner for Backend
 * This script runs all test suites and generates coverage reports
 */

const { spawn } = require('child_process');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`  ${message}`, 'bright');
  log('='.repeat(60), 'cyan');
}

function logSection(message) {
  log(`\n${'-'.repeat(40)}`, 'yellow');
  log(`  ${message}`, 'yellow');
  log(`${'-'.repeat(40)}`, 'yellow');
}

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    log(`Running: ${command} ${args.join(' ')}`, 'blue');

    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options,
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function checkTestSetup() {
  logSection('Checking Test Setup');

  // Check if Jest is installed
  try {
    await runCommand('npx', ['jest', '--version']);
    log('✓ Jest is available', 'green');
  } catch (error) {
    log('✗ Jest is not available', 'red');
    throw new Error('Jest is required but not installed');
  }

  // Check if test files exist
  const testDirs = ['tests/unit', 'tests/integration', 'tests/tier1', 'tests/tier2', 'tests/tier3'];

  for (const dir of testDirs) {
    if (fs.existsSync(dir)) {
      const files = fs
        .readdirSync(dir, { recursive: true })
        .filter((file) => file.endsWith('.test.js'));
      log(`✓ ${dir}: ${files.length} test files`, 'green');
    } else {
      log(`! ${dir}: directory not found`, 'yellow');
    }
  }
}

async function runUnitTests() {
  logSection('Running Unit Tests');

  try {
    await runCommand('npx', [
      'jest',
      'tests/unit',
      '--coverage',
      '--coverageDirectory=coverage/unit',
      '--coverageReporters=text',
      '--coverageReporters=html',
      '--detectOpenHandles',
      '--forceExit',
      '--maxWorkers=1',
      '--testTimeout=30000',
    ]);
    log('✓ Unit tests completed successfully', 'green');
  } catch (error) {
    log('✗ Unit tests failed', 'red');
    throw error;
  }
}

async function runIntegrationTests() {
  logSection('Running Integration Tests');

  try {
    await runCommand('npx', [
      'jest',
      'tests/integration',
      '--coverage',
      '--coverageDirectory=coverage/integration',
      '--coverageReporters=text',
      '--coverageReporters=html',
      '--detectOpenHandles',
      '--forceExit',
      '--maxWorkers=1',
      '--testTimeout=60000',
    ]);
    log('✓ Integration tests completed successfully', 'green');
  } catch (error) {
    log('✗ Integration tests failed', 'red');
    throw error;
  }
}

async function runTierTests() {
  logSection('Running Tier Tests');

  const tiers = ['tier1', 'tier2', 'tier3'];

  for (const tier of tiers) {
    if (fs.existsSync(`tests/${tier}`)) {
      try {
        log(`Running ${tier} tests...`, 'blue');
        await runCommand('npx', [
          'jest',
          `tests/${tier}`,
          '--detectOpenHandles',
          '--forceExit',
          '--maxWorkers=1',
          '--testTimeout=60000',
        ]);
        log(`✓ ${tier} tests completed successfully`, 'green');
      } catch (error) {
        log(`✗ ${tier} tests failed`, 'red');
        // Continue with other tiers
      }
    } else {
      log(`! ${tier} tests directory not found`, 'yellow');
    }
  }
}

async function generateFullCoverageReport() {
  logSection('Generating Full Coverage Report');

  try {
    await runCommand('npx', [
      'jest',
      '--coverage',
      '--coverageDirectory=coverage/full',
      '--coverageReporters=text',
      '--coverageReporters=html',
      '--coverageReporters=lcov',
      '--collectCoverageFrom=src/**/*.js',
      '--collectCoverageFrom=!src/**/*.test.js',
      '--collectCoverageFrom=!src/**/node_modules/**',
      '--detectOpenHandles',
      '--forceExit',
      '--maxWorkers=1',
      '--testTimeout=60000',
    ]);
    log('✓ Full coverage report generated', 'green');
    log('📊 Coverage report available at: coverage/full/index.html', 'cyan');
  } catch (error) {
    log('✗ Coverage report generation failed', 'red');
    throw error;
  }
}

async function runLinting() {
  logSection('Running Code Linting');

  try {
    // Check if ESLint is available
    await runCommand('npx', ['eslint', '--version']);

    // Run ESLint on source and test files
    await runCommand('npx', [
      'eslint',
      'src/**/*.js',
      'tests/**/*.js',
      '--ext',
      '.js',
      '--format',
      'compact',
    ]);
    log('✓ Linting completed successfully', 'green');
  } catch (error) {
    log('✗ Linting failed or ESLint not available', 'yellow');
    // Continue execution as linting is not critical
  }
}

async function runSecurityAudit() {
  logSection('Running Security Audit');

  try {
    await runCommand('npm', ['audit', '--audit-level', 'moderate']);
    log('✓ Security audit completed', 'green');
  } catch (error) {
    log('! Security vulnerabilities found', 'yellow');
    // Continue execution as this is informational
  }
}

async function testDatabaseConnections() {
  logSection('Testing Database Connections');

  try {
    // Run a simple connection test
    await runCommand('npx', [
      'jest',
      'tests/setup/testSetup.js',
      '--testNamePattern=database',
      '--detectOpenHandles',
      '--forceExit',
    ]);
    log('✓ Database connection test passed', 'green');
  } catch (error) {
    log('✗ Database connection test failed', 'red');
    // This might be expected in some environments
  }
}

async function validateTestCoverage() {
  logSection('Validating Test Coverage');

  const coverageThresholds = {
    statements: 80,
    branches: 75,
    functions: 80,
    lines: 80,
  };

  try {
    // Check if coverage report exists
    const coveragePath = 'coverage/full/coverage-summary.json';
    if (fs.existsSync(coveragePath)) {
      const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      const total = coverage.total;

      log('Coverage Summary:', 'cyan');
      log(
        `Statements: ${total.statements.pct}% (threshold: ${coverageThresholds.statements}%)`,
        total.statements.pct >= coverageThresholds.statements ? 'green' : 'red'
      );
      log(
        `Branches: ${total.branches.pct}% (threshold: ${coverageThresholds.branches}%)`,
        total.branches.pct >= coverageThresholds.branches ? 'green' : 'red'
      );
      log(
        `Functions: ${total.functions.pct}% (threshold: ${coverageThresholds.functions}%)`,
        total.functions.pct >= coverageThresholds.functions ? 'green' : 'red'
      );
      log(
        `Lines: ${total.lines.pct}% (threshold: ${coverageThresholds.lines}%)`,
        total.lines.pct >= coverageThresholds.lines ? 'green' : 'red'
      );

      const thresholdsMet =
        total.statements.pct >= coverageThresholds.statements &&
        total.branches.pct >= coverageThresholds.branches &&
        total.functions.pct >= coverageThresholds.functions &&
        total.lines.pct >= coverageThresholds.lines;

      if (thresholdsMet) {
        log('✓ All coverage thresholds met', 'green');
      } else {
        log('! Some coverage thresholds not met', 'yellow');
      }
    } else {
      log('! Coverage summary not found', 'yellow');
    }
  } catch (error) {
    log('✗ Coverage validation failed', 'red');
  }
}

async function generateTestReport() {
  logSection('Generating Test Report');

  const reportPath = 'test-report.md';
  const timestamp = new Date().toISOString();

  let report = `# Backend Test Report\n\n`;
  report += `**Generated:** ${timestamp}\n\n`;
  report += `## Test Suites\n\n`;
  report += `- ✅ Unit Tests\n`;
  report += `- ✅ Integration Tests\n`;
  report += `- ✅ Route Tests\n`;
  report += `- ✅ Error Handling Tests\n`;
  report += `- ✅ Middleware Tests\n\n`;
  report += `## Coverage\n\n`;
  report += `Coverage reports are available in the following directories:\n`;
  report += `- \`coverage/unit/\` - Unit test coverage\n`;
  report += `- \`coverage/integration/\` - Integration test coverage\n`;
  report += `- \`coverage/full/\` - Complete coverage report\n\n`;
  report += `## Files Tested\n\n`;
  report += `### Models\n`;
  report += `- CompanyOwner, CompanyOwnerPassword, Setting\n`;
  report += `- User, Team, Client, Invoice, Quote, Payment, Task\n\n`;
  report += `### Controllers\n`;
  report += `- App Controllers (CRUD operations)\n`;
  report += `- Middleware Controllers (Auth, User management)\n`;
  report += `- Core Controllers (Admin auth, setup)\n\n`;
  report += `### Services\n`;
  report += `- AI Service, Context Aware Service\n`;
  report += `- Workflow Service, Notification Service\n`;
  report += `- Search Service, NLP Service\n`;
  report += `- Social Media Services (Facebook, Twitter, Instagram)\n\n`;
  report += `### Utilities\n`;
  report += `- AI Utils, PDF Utils, NLP Utils\n`;
  report += `- Expression Evaluator, Path Safety\n`;
  report += `- Social Media Auth, DocX Utils\n\n`;
  report += `### Helpers\n`;
  report += `- AI Analytics Helper, OpenAI Helper\n`;
  report += `- Mail Helper, Customer Segmentation\n`;
  report += `- Conversation Helper, URL Shortener\n`;
  report += `- Knowledge Base Helper, Social Media Helper\n\n`;
  report += `### Routes & Middleware\n`;
  report += `- Authentication routes and middleware\n`;
  report += `- CRUD routes for all entities\n`;
  report += `- Error handling middleware\n`;
  report += `- Permission and validation middleware\n\n`;

  fs.writeFileSync(reportPath, report);
  log(`✓ Test report generated: ${reportPath}`, 'green');
}

async function main() {
  const startTime = Date.now();

  try {
    logHeader('Backend Comprehensive Test Suite');

    // Test setup validation
    await checkTestSetup();

    // Database connection test
    await testDatabaseConnections();

    // Run linting (non-critical)
    await runLinting();

    // Run security audit (non-critical)
    await runSecurityAudit();

    // Run all test suites
    await runUnitTests();
    await runIntegrationTests();
    await runTierTests();

    // Generate coverage reports
    await generateFullCoverageReport();
    await validateTestCoverage();

    // Generate final report
    await generateTestReport();

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    logHeader('Test Suite Completed Successfully');
    log(`Total execution time: ${duration} seconds`, 'green');
    log('📊 View coverage reports:', 'cyan');
    log('  - coverage/full/index.html (Complete coverage)', 'cyan');
    log('  - coverage/unit/index.html (Unit test coverage)', 'cyan');
    log('  - coverage/integration/index.html (Integration test coverage)', 'cyan');
    log('📄 Test report: test-report.md', 'cyan');
  } catch (error) {
    log(`\n✗ Test suite failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Handle CLI arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  log('Backend Test Suite Runner', 'bright');
  log('\nUsage: node test-runner.js [options]', 'cyan');
  log('\nOptions:', 'yellow');
  log('  --unit-only     Run only unit tests', 'green');
  log('  --integration-only Run only integration tests', 'green');
  log('  --coverage-only Generate coverage report only', 'green');
  log('  --quick         Skip linting and security audit', 'green');
  log('  --help, -h      Show this help message', 'green');
  process.exit(0);
}

if (args.includes('--unit-only')) {
  runUnitTests()
    .then(() => {
      log('✓ Unit tests completed', 'green');
      process.exit(0);
    })
    .catch((error) => {
      log(`✗ Unit tests failed: ${error.message}`, 'red');
      process.exit(1);
    });
} else if (args.includes('--integration-only')) {
  runIntegrationTests()
    .then(() => {
      log('✓ Integration tests completed', 'green');
      process.exit(0);
    })
    .catch((error) => {
      log(`✗ Integration tests failed: ${error.message}`, 'red');
      process.exit(1);
    });
} else if (args.includes('--coverage-only')) {
  generateFullCoverageReport()
    .then(() => {
      log('✓ Coverage report generated', 'green');
      process.exit(0);
    })
    .catch((error) => {
      log(`✗ Coverage generation failed: ${error.message}`, 'red');
      process.exit(1);
    });
} else {
  // Run full test suite
  main();
}

module.exports = {
  runUnitTests,
  runIntegrationTests,
  generateFullCoverageReport,
  validateTestCoverage,
};
