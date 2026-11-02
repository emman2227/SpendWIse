module.exports = {
  root: true,
  extends: [require.resolve('../../packages/config/eslint/react-native.cjs')],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react-native/no-color-literals': 'off',
    'react-native/sort-styles': 'off',
    'react-native/no-raw-text': 'off',
  },
};
