module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/src/renderer/setupTests.js'],
    testMatch: ['<rootDir>/src/renderer/**/__tests__/**/*.test.js'],
  };