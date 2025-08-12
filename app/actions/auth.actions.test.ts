// app/actions/auth.actions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requestPasswordChangeAction } from '@/app/actions/auth.actions';
import { auth0 } from '@/lib/auth0';
import { env } from '@/lib/env';

// --- モジュールのモック設定 ---
// `auth.actions.ts`が依存しているモジュールをモック化
vi.mock('@/lib/auth0');
vi.mock('@/lib/env', () => ({
  env: {
    AUTH0_DOMAIN: 'test-domain.auth0.com',
    AUTH0_CLIENT_ID: 'test-client-id-12345',
  },
}));

// --- `fetch` APIのモック ---
// vi.fn()で空のモック関数を作成
const mockFetch = vi.fn();
// vi.stubGlobalでグローバルのfetchをモックに差し替え
vi.stubGlobal('fetch', mockFetch);

// --- テスト本体 ---
describe('auth.actions.ts', () => {
  const mockedGetSession = vi.mocked(auth0.getSession);

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // --- ケース1: 正常系 (ハッピーパス) ---
  it('正常にパスワード変更リクエストが成功する', async () => {
    // 準備: 認証済みでメールアドレスがある状態をシミュレート
    mockedGetSession.mockResolvedValue({
      user: { email: 'test@example.com' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // 準備: fetchが成功レスポンスを返すように設定
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ message: 'OK' }), { status: 200 }),
    );

    // 実行
    const result = await requestPasswordChangeAction();

    // 検証
    expect(result).toEqual({
      success: true,
      message: 'パスワード変更用のメールを送信しました。',
    });

    // fetchが正しいURLとbodyで呼び出されたか検証
    // 1. fetchが1回だけ呼び出されたことを確認
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // 2. 実際に渡されたRequestオブジェクトを取得
    const actualRequest = mockFetch.mock.calls[0][0] as Request;

    // 3. Requestオブジェクトのプロパティを個別に検証
    expect(actualRequest.url).toBe(
      `https://${env.AUTH0_DOMAIN}/dbconnections/change_password`,
    );
    expect(actualRequest.method).toBe('POST');
    expect(actualRequest.headers.get('Content-Type')).toBe('application/json');

    // 4. bodyは非同期でjson()メソッドを使って検証する
    await expect(actualRequest.json()).resolves.toEqual({
      client_id: env.AUTH0_CLIENT_ID,
      email: 'test@example.com',
      connection: 'Username-Password-Authentication',
    });
  });

  // --- ケース2: 環境変数が不足している場合 (DOMAIN) ---
  it('AUTH0_DOMAINが設定されていない場合、エラーをスローする', async () => {
    // 準備: AUTH0_DOMAINの取得値をモック
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(env, 'AUTH0_DOMAIN', 'get').mockReturnValue(undefined as any);

    // 準備: 認証済みユーザー
    mockedGetSession.mockResolvedValue({
      user: { email: 'test@example.com' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // 実行 & 検証
    await expect(requestPasswordChangeAction()).rejects.toThrow(
      'Auth0のドメインまたはクライアントIDが設定されていません。',
    );
  });

  // --- ケース3: 環境変数が不足している場合 (CLIENT_ID) ---
  it('AUTH0_CLIENT_IDが設定されていない場合、エラーをスローする', async () => {
    // 準備: AUTH0_CLIENT_IDの取得値をモック
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(env, 'AUTH0_CLIENT_ID', 'get').mockReturnValue(undefined as any);

    // 準備: 認証済みユーザー
    mockedGetSession.mockResolvedValue({
      user: { email: 'test@example.com' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // 実行 & 検証
    await expect(requestPasswordChangeAction()).rejects.toThrow(
      'Auth0のドメインまたはクライアントIDが設定されていません。',
    );
  });

  // --- ケース4: メールアドレスが取得できない場合 ---
  it('セッションにメールアドレスがない場合、エラーをスローする', async () => {
    // 準備: メールアドレスを含まないセッション情報
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedGetSession.mockResolvedValue({ user: {} } as any);

    // 実行 & 検証
    await expect(requestPasswordChangeAction()).rejects.toThrow(
      'ユーザーのメールアドレスが取得できませんでした。',
    );
  });

  // --- ケース5: Auth0 APIがエラーを返した場合 ---
  it('Auth0 APIへのリクエストが失敗した場合、エラーをスローする', async () => {
    // 準備: 認証済みユーザー
    mockedGetSession.mockResolvedValue({
      user: { email: 'test@example.com' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // 準備: fetchが失敗レスポンス(例: 400 Bad Request)を返すように設定
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ error: 'invalid_request' }), {
        status: 400,
      }),
    );

    // 実行 & 検証
    await expect(requestPasswordChangeAction()).rejects.toThrow(
      'パスワード変更リクエストの送信に失敗しました。',
    );
  });

  // --- ケース6: ネットワークエラーなどでfetch自体が失敗した場合 ---
  it('fetchでネットワークエラーが発生した場合、エラーをスローする', async () => {
    // 準備: 認証済みユーザー
    mockedGetSession.mockResolvedValue({
      user: { email: 'test@example.com' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // 準備: fetchがPromise.rejectで失敗するように設定
    const networkError = new Error('Network failed');
    mockFetch.mockRejectedValue(networkError);

    // 実行 & 検証
    await expect(requestPasswordChangeAction()).rejects.toThrow(
      networkError.message,
    );
  });

  // --- ケース7: 予期せぬエラー形式の場合 ---
  it('Errorインスタンスでないエラーがスローされた場合、汎用エラーメッセージを返す', async () => {
    // 準備: 認証済みユーザー
    mockedGetSession.mockResolvedValue({
      user: { email: 'test@example.com' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // 準備: fetchがErrorインスタンスではない値をrejectするように設定
    const nonErrorObject = 'ただの文字列エラー';
    mockFetch.mockRejectedValue(nonErrorObject);

    // 実行 & 検証
    await expect(requestPasswordChangeAction()).rejects.toThrow(
      '予期せぬエラーが発生しました。',
    );
  });
});
