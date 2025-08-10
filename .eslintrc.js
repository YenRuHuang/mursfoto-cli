module.exports = {
  env: {
    browser: false,
    es2021: true,
    node: true
  },
  extends: [
    'standard'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // 寬鬆的規則，適合初始發布
    'no-console': 'off',
    'no-unused-vars': 'warn',
    'prefer-const': 'warn'
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'docs/',
    'templates/',
    '*.test.js',
    'test-*.js'
  ]
}
