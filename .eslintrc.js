module.exports = {
  env: { node: true, es6: true, browser: true },
  parserOptions: {
    project: './tsconfig.json',
  },
  plugins: [],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'prettier/@typescript-eslint',
    'plugin:jest/recommended',
  ],
  rules: {
    '@typescript-eslint/no-non-null-assertion': 'off',
  },
}
