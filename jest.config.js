/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/projects'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        lib: ['ES2020', 'DOM']
      }
    }]
  },
  collectCoverageFrom: [
    'projects/**/*.ts',
    '!projects/**/*.d.ts',
    '!projects/**/*.test.ts'
  ],
  globals: {
    'ts-jest': {
      tsconfig: {
        module: 'commonjs',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        lib: ['ES2020', 'DOM']
      }
    }
  }
};
