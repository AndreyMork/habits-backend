module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/startServer.ts',
    '!src/testUtils/**/*',
    // '!src/**/types.ts',
    // '!src/**/*.types.ts',
  ],
  testMatch: ['**/*.(test|spec).ts'],
  errorOnDeprecated: true,
  verbose: true,
  testTimeout: 10000,
  // preset,
};
