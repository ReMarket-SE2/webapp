// eslint-disable-next-line @typescript-eslint/no-require-imports
const nextJest = require('next/jest');

// Providing the path to your Next.js app which will enable loading next.config.js and .env files
const createJestConfig = nextJest({ dir: './' });

// Any custom config you want to pass to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js', '**/tests/**/*.test.ts', '**/tests/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'jsdom',
  coverageReporters: [['text', { skipFull: true }], 'cobertura'],
  transformIgnorePatterns: [
    '/node_modules/(?!(.pnpm/)?(react-markdown|remark-gfm|micromark|decode-named-character-reference|character-entities|markdown|mdast|unist|unified|rehype|hast|property-information|space-separated-tokens|comma-separated-tokens|vfile))',
  ],
};

// createJestConfig is exported in this way to ensure that next/jest can load the Next.js configuration
module.exports = createJestConfig(customJestConfig);
