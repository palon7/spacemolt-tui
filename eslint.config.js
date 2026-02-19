// @ts-check
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import prettierConfig from 'eslint-config-prettier';

export default defineConfig(
  // 無視するファイル
  globalIgnores(['dist/**', 'node_modules/**']),

  // TypeScript + Ink ソース
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [tseslint.configs.recommended],
    plugins: {
      // @ts-ignore
      'react-hooks': reactHooks,
    },
    rules: {
      // React Hooks ルール（Ink でも同様に有効）
      ...reactHooks.configs.recommended.rules,

      // TypeScript
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    },
  },

  // Prettier との競合を無効化（最後に適用）
  prettierConfig,
);
