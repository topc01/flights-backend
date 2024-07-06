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
      files: ['*.js'],
    },
  ],
  rules: {
    'max-len': ['error', { code: 120 }],
    'consistent-return': 'off',
    'no-console': 'off',
    camelcase: 'off',
    'no-underscore-dangle': ['error', { allow: ['_id'] }],
    indent: ['error', 2],
  },
  extends: 'airbnb',
};
