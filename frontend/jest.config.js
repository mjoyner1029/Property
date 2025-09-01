module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup/jest.setup.js'],
  moduleFileExtensions: ['js','jsx','json'],
  transform: { 
    '^.+\\.[jt]sx?$': ['babel-jest', { rootMode: 'upward' }] 
  },
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    // Also support non-caret imports
    'src/(.*)': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': '<rootDir>/src/test/mocks/styleMock.js',
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg|webp)$': '<rootDir>/src/test/mocks/fileMock.js'
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/', 
    '<rootDir>/.jest/', 
    '<rootDir>/src/__tests__/__mocks__/'
  ],
  clearMocks: true,
  resetMocks: false,
  restoreMocks: true,
  testTimeout: 15000,
  maxWorkers: '50%',
  modulePathIgnorePatterns: ['<rootDir>/dist/','<rootDir>/build/'],
  watchPathIgnorePatterns: ['<rootDir>/node_modules/','<rootDir>/.cache/'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.{spec,test}.{js,jsx}',
    '!src/test/**',
    '!src/index.js',
    '!src/reportWebVitals.js',
  ],
  coverageDirectory: 'coverage',
};
