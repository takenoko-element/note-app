// tests/setup.ts
import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { server } from '../mocks/server';
import '@testing-library/jest-dom';

// MSWサーバーを全テストの開始前に起動
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// 各テストが終了するたびに、レンダーされたコンポーネントをクリーンアップ
afterEach(() => {
  cleanup();
  // MSWのハンドラをリセットして、テスト間の影響を防ぐ
  server.resetHandlers();
});

// 全テストの終了後にMSWサーバーを閉じる
afterAll(() => server.close());
