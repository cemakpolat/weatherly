module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['./src/renderer/setupTests.js'],
    testMatch: ['./src/renderer/__tests__/**/*.test.js'],
  };