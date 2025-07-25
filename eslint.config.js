import antfu from '@antfu/eslint-config'

export default antfu(
  {
    typescript: true,
    vue: false,
    jsonc: true,
    markdown: true,
    formatters: {
      css: true,
      html: true,
      markdown: 'prettier',
    },
  },
  {
    rules: {
      // 通用规则
      'no-console': 'off', // 允许 console 语句
      'no-debugger': 'warn',
      'prefer-const': 'error',

      // TypeScript 规则
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // 禁用一些严格的规则
      'node/prefer-global/process': 'off',
      'style/indent': 'off',
      'jsonc/sort-keys': 'off',
      'no-fallthrough': 'off',
      'regexp/no-super-linear-backtracking': 'off',
      'antfu/no-top-level-await': 'off',
      'no-case-declarations': 'off',
      'unused-imports/no-unused-vars': 'off',

      // 装饰器相关
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/ban-types': 'off',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
)
