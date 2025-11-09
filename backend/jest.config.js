module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000, // Reduced to 30 seconds
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    // '<rootDir>/tests/performance/', // Temporarily enabled for debugging
    // '<rootDir>/tests/security/', // Temporarily enabled for final verification
    '/coverage/',
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/setup/**',
    '!src/test/**',
    '!**/node_modules/**',
    '!**/coverage/**',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  setupFilesAfterEnv: ['<rootDir>/tests/setup/testSetup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  verbose: false,
  detectOpenHandles: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  maxWorkers: 1,
  // Add bail option to stop on first failure
  bail: false,
  // Force garbage collection and memory management
  logHeapUsage: true,

  // Coverage thresholds based on tier importance
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75,
    },
    // TIER 1 - Critical components require highest coverage
    './src/controllers/coreControllers/adminAuth.js': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './src/controllers/appControllers/invoiceController/': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/controllers/middlewaresControllers/createCRUDController/': {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
};
