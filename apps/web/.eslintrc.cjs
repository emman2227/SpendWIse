module.exports = {
  root: true,
  extends: [require.resolve('../../packages/config/eslint/next.cjs')],
  settings: {
    next: {
      rootDir: 'apps/web/',
    },
  },
};
