// jest.config.js
// Configuracao do Jest para ES modules com jsdom

export default {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleNameMapper: {
    '^./js/(.*)$': '<rootDir>/js/$1',
    '^./config.js$': '<rootDir>/js/config.js',
    '^https://cdn\\.jsdelivr\\.net/npm/appwrite@13\\.0\\.0/\\+esm$': '<rootDir>/tests/__mocks__/appwrite.js',
    '^https://cdn\\.jsdelivr\\.net/npm/appwrite@16\\.0\\.0/\\+esm$': '<rootDir>/tests/__mocks__/appwrite.js',
  },
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/*.integration.js',
    '!js/*.CONSOLE_TESTS.js'
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },
  globals: {
    'window': {},
    'localStorage': {},
    'document': {}
  }
};
