module.exports = {
  env: {
    'react-native/react-native': true
  },
  plugins: ['react', 'react-hooks', 'react-native'],
  extends: [
    require.resolve('./base.cjs'),
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react-native/all'
  ],
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    'react-native/no-inline-styles': 'off'
  }
};
