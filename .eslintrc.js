module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:import/recommended',
    'plugin:promise/recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['import', 'promise'],
  rules: {
    // Error prevention
    'no-console': 'off', // Allow console.log for Electron app
    'no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    'no-undef': 'error',
    'no-unreachable': 'error',

    // Code quality
    'prefer-const': 'warn',
    'no-var': 'warn',
    eqeqeq: ['warn', 'always'],
    'object-shorthand': 'warn',
    'prefer-template': 'warn',
    'prefer-arrow-callback': 'warn',

    // Import rules
    'import/no-unresolved': 'off', // Turn off for now as we use relative imports
    'import/named': 'error',
    'import/default': 'error',
    'import/namespace': 'error',
    'import/no-duplicates': 'warn',

    // Promise rules
    'promise/always-return': 'off',
    'promise/no-return-wrap': 'warn',
    'promise/param-names': 'error',
    'promise/catch-or-return': 'warn',
    'promise/no-nesting': 'warn',

    // Best practices
    curly: ['warn', 'all'],
    'no-eval': 'error',
    'no-implied-eval': 'error',

    // Style (handled by Prettier, so keep minimal)
    'no-trailing-spaces': 'warn',
    'no-multiple-empty-lines': ['warn', { max: 2, maxEOF: 1 }],
  },
  globals: {
    // Electron globals
    electron: 'readonly',
    L: 'readonly', // Leaflet global
  },
  overrides: [
    {
      // Test files
      files: ['**/__tests__/**/*.js', '**/*.test.js', '**/*.spec.js'],
      env: {
        jest: true,
      },
      rules: {
        'no-unused-expressions': 'off',
      },
    },
    {
      // Main process files
      files: ['src/main/**/*.js', 'src/preload.js', 'src/storage.js'],
      env: {
        node: true,
        browser: false,
      },
    },
    {
      // Renderer process files
      files: ['src/renderer/**/*.js'],
      env: {
        browser: true,
        node: false,
      },
      globals: {
        electron: 'readonly',
      },
    },
  ],
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
