import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // グローバルなテストAPIを有効にする（importなしでdescribe, it, expectなどを使える）
    globals: true,
    // テスト環境としてjsdom（ブラウザ環境のシミュレーション）を指定
    environment: 'jsdom',
    // 各テストの前に実行するセットアップファイルのパスを指定
    setupFiles: './tests/setup.ts',
    // CSSファイルのインポートをモックする設定（テスト実行速度の向上）
    css: true,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,playwright}.config.*',
      // PlaywrightのE2Eテストフォルダを除外
      '**/e2e/**',
    ],
  },
  // tsconfig.jsonのパスエイリアス（例: @/*）をVitestに認識させる設定
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
