const spfxProfile = require('@microsoft/eslint-config-spfx/lib/flat-profiles/react');

module.exports = [
  {
    ignores: [
      'dist/**',
      'lib/**',
      'lib-commonjs/**',
      'lib-esm/**',
      'release/**',
      'temp/**',
      'node_modules/**',
      '*.config.ts',
      '*.config.cjs',
      '*.config.js'
    ]
  },
  ...spfxProfile,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: './tsconfig.json'
      }
    }
  }
];
