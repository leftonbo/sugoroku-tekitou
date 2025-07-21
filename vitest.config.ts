import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // テスト環境設定
    environment: 'jsdom',
    
    // テストファイルパターン（testsフォルダ内）
    include: ['tests/**/*.{test,spec}.{js,ts}'],
    
    // TypeScriptサポート
    typecheck: {
      enabled: true
    },
    
    // カバレッジ設定
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['tests/**/*', 'src/**/*.test.ts', 'src/**/*.spec.ts', 'dist/**'],
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'coverage'
    },
    
    // ウォッチモード設定
    watch: false,
    
    // レポーター設定
    reporter: ['verbose', 'html'],
    
    // 並列実行設定
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false
      }
    }
  },
  
  // resolve設定でTypeScriptモジュール解決を改善
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});