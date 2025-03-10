const {defaults} = require('jest-config');

/** @type {import('jest').Config} */
const config = {
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'mts', 'cts'],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./jest.setup.js'],
  testTimeout: 10000, // Increased timeout for DynamoDB operations
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
  collectCoverageFrom: [
    'express/src/**/*.js',
    '!**/node_modules/**',
    '!**/vendor/**'
  ]
};

module.exports = config;