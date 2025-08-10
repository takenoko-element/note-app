// tests/setup.ts
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { server } from '../mocks/server';
import '@testing-library/jest-dom';

// JSDOMにはURL.createObjectURLが存在しないため、テスト用にモックする
if (typeof window.URL.createObjectURL === 'undefined') {
  // Object.definePropertyを使って、読み取り専用のプロパティにも設定できるようにする
  Object.defineProperty(window.URL, 'createObjectURL', {
    // vi.fn()で空のモック関数を作成し、ダミーのURL文字列を返すように設定
    value: vi.fn(() => 'blob:http://localhost:3000/dummy-image-url'),
    writable: true, // 念のため書き込み可能にしておく
  });
}
// createObjectURLと対になるrevokeObjectURLも、同様にモックしておく
if (typeof window.URL.revokeObjectURL === 'undefined') {
  Object.defineProperty(window.URL, 'revokeObjectURL', {
    value: vi.fn(),
    writable: true,
  });
}

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
