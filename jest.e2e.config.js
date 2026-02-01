module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/renderer/setupTests.js'],
  testMatch: [
    '<rootDir>/src/renderer/__tests__/e2e.test.js',
    '<rootDir>/src/renderer/__tests__/integration.test.js',
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/__tests__/**',
    '!src/**/node_modules/**',
  ],
  coverageDirectory: 'coverage/e2e',
  coverageReporters: ['text', 'lcov', 'html'],
};
