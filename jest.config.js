module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  moduleNameMapper: {
    '@/(.*)$': '<rootDir>/src/$1',
  },
};