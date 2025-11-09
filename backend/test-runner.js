#!/usr/bin/env node

const { spawn } = require('child_process');

// Test runner with timeout protection
class TestRunner {
  constructor() {
    this.maxTimeout = 300000; // 5 minutes max for any test suite
    this.testProcess = null;
  }

  async runTestsWithTimeout(command, args = []) {
    return new Promise((resolve, reject) => {
      console.log(`Running: ${command} ${args.join(' ')}`);

      this.testProcess = spawn(command, args, {
        stdio: 'inherit',
        shell: true,
        cwd: process.cwd(),
        env: {
          ...process.env,
          NODE_ENV: 'test',
          FORCE_COLOR: '1',
        },
      });

      // Set overall timeout
      const timeoutId = setTimeout(() => {
        console.log('\n⚠️  Test timeout reached, killing process...');
        if (this.testProcess) {
          this.testProcess.kill('SIGKILL');
        }
        reject(new Error('Test execution timed out'));
      }, this.maxTimeout);

      this.testProcess.on('close', (code) => {
        clearTimeout(timeoutId);
        if (code === 0) {
          console.log('✅ Tests completed successfully');
          resolve(code);
        } else {
          console.log(`❌ Tests failed with exit code: ${code}`);
          resolve(code); // Don't reject, just return the code
        }
      });

      this.testProcess.on('error', (error) => {
        clearTimeout(timeoutId);
        console.error('❌ Error running tests:', error);
        reject(error);
      });

      // Handle process interruption
      process.on('SIGINT', () => {
        console.log('\n🛑 Received SIGINT, killing test process...');
        if (this.testProcess) {
          this.testProcess.kill('SIGKILL');
        }
        process.exit(1);
      });
    });
  }

  async runTestSuite(suiteName) {
    const testCommands = {
      all: ['npm', ['test:all']],
      unit: ['npm', ['test:unit']],
      integration: ['npm', ['test:integration']],
      security: ['npm', ['test:security']],
      performance: ['npm', ['test:performance']],
      fast: ['npm', ['test:fast']],
      tier1: ['npm', ['test:tier1']],
      tier2: ['npm', ['test:tier2']],
      tier3: ['npm', ['test:tier3']],
    };

    if (!testCommands[suiteName]) {
      console.error(`❌ Unknown test suite: ${suiteName}`);
      console.log('Available suites:', Object.keys(testCommands).join(', '));
      process.exit(1);
    }

    const [command, args] = testCommands[suiteName];

    try {
      const exitCode = await this.runTestsWithTimeout(command, args);
      process.exit(exitCode);
    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
      process.exit(1);
    }
  }
}

// CLI Interface
const args = process.argv.slice(2);
const suiteName = args[0] || 'fast';

console.log(`🚀 Starting test suite: ${suiteName}`);
console.log(`⏰ Maximum timeout: ${300000 / 1000} seconds`);

const runner = new TestRunner();
runner.runTestSuite(suiteName);
