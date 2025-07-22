import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // 基本的なJavaScriptルール
  js.configs.recommended,
  
  // TypeScriptの推奨設定
  ...tseslint.configs.recommended,
  
  // Prettierとの競合を避ける設定
  prettierConfig,
  
  {
    // 対象ファイル
    files: ['src/**/*.{ts,js}', '*.{ts,js}'],
    
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    
    rules: {
      // TypeScript固有のルール
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      
      // 一般的なコード品質ルール
      'no-console': 'off', // ゲーム開発でデバッグログは重要
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['warn', 'all'], // 波括弧は推奨だが厳格にしない
      
      // ゲーム開発で有用なルール（緩めに設定）
      'no-magic-numbers': 'off', // ゲームバランス調整で数値が多いので無効化
    },
  },
  
  {
    // テストファイル用の設定
    files: ['**/*.test.{ts,js}', '**/*.spec.{ts,js}'],
    rules: {
      'no-magic-numbers': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  
  
  {
    // 除外するファイル/ディレクトリ
    ignores: [
      'dist/**',
      'html/**',
      'node_modules/**',
      'coverage/**',
      'tests/**',
      '*.config.js',
      '*.config.ts',
      'test-number-formatting.js',
    ],
  }
);