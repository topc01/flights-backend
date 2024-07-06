module.exports = {
  env: {
    node: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  overrides: [
    {
      files: ['**/*.js', '**/*.test.js'],
      env: {
        jest: true,
      },
    },
  ],
  rules: {
    'max-len': ['error', { code: 120 }],
    'consistent-return': 'off',
    'no-console': 'off',
    camelcase: 'off',
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: ['**/*.test.js'],
      },
    ],
    'no-underscore-dangle': ['error', { allow: ['_id', '_doc'] }],
  },
  extends: 'airbnb',
};
