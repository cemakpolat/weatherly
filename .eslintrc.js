module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // Error prevention
    'no-console': 'off', // Allow console.log for debugging
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-undef': 'error',

    // Code quality
    'prefer-const': 'warn',
    'no-var': 'warn',
    eqeqeq: ['warn', 'always'],

    // Style (handled by Prettier, so keep minimal)
    'no-trailing-spaces': 'warn',
    'no-multiple-empty-lines': ['warn', { max: 2 }],
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'coverage/',
    '*.min.js',
    '.prettierrc',
    'jest.config.js',
    'jest.e2e.config.js',
  ],
};
