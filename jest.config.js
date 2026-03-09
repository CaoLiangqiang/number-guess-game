module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'js/**/*.js',
    '**/*.js',
    '!node_modules/**'
  ],
  coverageDirectory: 'coverage',
  verbose: true
};