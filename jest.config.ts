import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    globalSetup: './jest.setup.ts',
    cache: false, // disabled caching to prevent old Tact files from being used after a rebuild
    testEnvironment: '@ton/sandbox/jest-environment',
    // Backend uses Node's built-in test runner (`backend/tests/*.test.js`).
    // Keep contract Jest tests isolated to avoid mixed runners.
    testPathIgnorePatterns: ['/node_modules/', '/dist/', '/backend/tests/'],
    reporters: ['default', ['@ton/sandbox/jest-reporter', {}]],
};

export default config;
