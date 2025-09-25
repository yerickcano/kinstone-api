module.exports = {
  extends: [
    'next/core-web-vitals',
    'next/typescript'
  ],
  rules: {
    // Custom rules for our API
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'off', // Allow any in database/API code for flexibility
    '@typescript-eslint/explicit-function-return-type': 'off', // Next.js API routes don't need explicit return types
    'prefer-const': 'error',
    'no-var': 'error',
    'no-console': 'off', // Allow console.log in API routes
  },
  env: {
    node: true,
    es6: true,
  },
  ignorePatterns: [
    'node_modules/',
    '.next/',
    'dist/',
    '*.js' // Ignore JS config files
  ]
};
