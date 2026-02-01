module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/src/renderer/setupTests.js'],
    testMatch: [
      '<rootDir>/src/renderer/**/__tests__/**/*.test.js',
      '<rootDir>/src/main/**/__tests__/**/*.test.js',
    ],
    testEnvironmentOptions: {
      resources: 'usable',
      runScripts: 'dangerously',
    },
    collectCoverageFrom: [
      'src/**/*.js',
      '!src/**/__tests__/**',
      '!src/**/node_modules/**',
      '!coverage/**',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html', 'json'],
    testTimeout: 10000,
    maxWorkers: '50%',
  };