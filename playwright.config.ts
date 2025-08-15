import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  // テストファイルがあるディレクトリ
  testDir: './e2e',
  // テストを並列実行するか
  fullyParallel: true,
  // 誤ってソースコードに test.only を残した場合、CI でのビルドが失敗します
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  // テスト結果をHTMLレポートで出力
  reporter: 'html',
  globalSetup: require.resolve('./e2e/auth.setup.ts'),
  use: {
    // baseURLを設定すると、テストコード内で page.goto('/') と書くだけで
    // 'http://localhost:3000/' にアクセスしてくれるようになる
    baseURL: 'http://localhost:3000',
    // 保存した認証情報を使って、すべてのテストをログイン済み状態で開始する
    storageState: 'auth.json',
    // テスト中のスクリーンショットやビデオの保存設定
    trace: 'on-first-retry',
  },

  // webServer: テスト実行前にローカルサーバーを自動で起動するための設定
  webServer: {
    // Next.jsの開発サーバーを起動するコマンド
    command: 'npm run dev:test',
    // サーバーが起動したことを検知するためのURL
    url: 'http://localhost:3000',
    // サーバー起動後にテストを再利用するか
    reuseExistingServer: !process.env.CI,
  },

  // 主要ブラウザ向けにプロジェクトを構成する
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
