const { defaults } = require('jest-config');

/** @type {import('jest').Config} */
const config = {
    moduleFileExtensions: [...defaults.moduleFileExtensions, 'mts', 'cts'],
    testEnvironment: 'node',
    setupFilesAfterEnv: ['./jest.setup.js'],
    testTimeout: 10000,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'clover', 'html'],
    collectCoverageFrom: [
        'express/src/**/*.js',
        'Login/**/*.js',
        '!**/node_modules/**',
        '!**/vendor/**',
        '!express/src/server.js',
        '!Login/auth-server.js'
    ]
};

module.exports = config;
