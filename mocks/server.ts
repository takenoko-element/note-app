// mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// ここで作成したサーバーを tests/setup.ts でインポートして利用する
export const server = setupServer(...handlers);
