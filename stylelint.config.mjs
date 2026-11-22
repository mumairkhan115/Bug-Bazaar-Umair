export default {
  extends: ['stylelint-config-standard-scss'],
  plugins: ['stylelint-declaration-strict-value'],
  ignoreFiles: ['dist/**', 'node_modules/**'],
  rules: {
    'selector-class-pattern': [
      '^[a-z][a-z0-9-]*(__[a-z0-9-]+)?(--[a-z0-9-]+)?$',
      { message: 'Expected BEM class (block, block__element, block--modifier)' },
    ],
    'scale-unlimited/declaration-strict-value': [
      ['/color/', 'fill', 'stroke'],
      {
        ignoreValues: ['transparent', 'currentcolor', 'inherit', 'none'],
      },
    ],
    'scss/load-partial-extension': null,
    'no-descending-specificity': null,
  },
  overrides: [
    {
      files: ['src/assets/sass/variables.scss', 'src/assets/sass/global.scss'],
      rules: {
        'scale-unlimited/declaration-strict-value': null,
        'selector-class-pattern': null,
      },
    },
  ],
};
