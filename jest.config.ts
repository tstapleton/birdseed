import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/src/testing/setup-jest.ts'],
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
};

export default config;
