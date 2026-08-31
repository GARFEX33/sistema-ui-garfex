import eslint from '@eslint/js'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import storybook from 'eslint-plugin-storybook'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      'dist',
      'storybook-static',
      'coverage',
      'node_modules',
      '.codegraph',
      'src/app/routeTree.gen.ts',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'warn',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            'storybook/**',
            '**/operationsInbox.fixtures',
            '@tanstack/react-form',
            '@tanstack/react-table',
            '@tanstack/react-virtual',
          ],
        },
      ],
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: { globals: { console: 'readonly', process: 'readonly' } },
  },
  ...storybook.configs['flat/recommended'].map((config) => ({
    ...config,
    files: ['storybook/**/*.stories.{ts,tsx}'],
  })),
  prettier,
)
