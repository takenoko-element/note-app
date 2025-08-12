import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveImageAndGetUrl } from '@/lib/image.service';
import { createClient } from '@supabase/supabase-js';

// --- Supabaseクライアントのモック設定 ---
const mockUpload = vi.fn();
const mockCreateSignedUrl = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockImplementation(() => ({
    storage: {
      from: vi.fn().mockReturnValue({
        upload: mockUpload,
        createSignedUrl: mockCreateSignedUrl,
      }),
    },
  })),
}));

// env.tsのモック
vi.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'dummy-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'dummy-service-role-key',
    SUPABASE_BUCKET_NAME: 'dummy-bucket',
    AUTH0_SECRET: 'dummy-auth0-secret',
    AUTH0_DOMAIN: 'dummy.auth0.com',
    AUTH0_CLIENT_ID: 'dummy-client-id',
    AUTH0_CLIENT_SECRET: 'dummy-client-secret',
  },
}));

// --- テスト本体 ---
describe('image.service.ts', () => {
  // 各テストの前に、モックの呼び出し履歴などをリセット
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- 1. ファイルがnullの場合 ---
  it('ファイルがnullの場合、undefinedを返しSupabaseクライアントを呼び出さない', async () => {
    const result = await saveImageAndGetUrl(null);

    expect(result).toBeUndefined();
    // createClientが呼び出されないことを確認
    expect(createClient).not.toHaveBeenCalled();
  });

  // --- 2. ファイルサイズが0の場合 ---
  it('ファイルサイズが0の場合、undefinedを返しSupabaseクライアントを呼び出さない', async () => {
    const emptyFile = new File([], 'empty.png', { type: 'image/png' });
    const result = await saveImageAndGetUrl(emptyFile);

    expect(result).toBeUndefined();
    expect(createClient).not.toHaveBeenCalled();
  });

  // --- 3. 正常にアップロードとURL生成が完了する場合 (ハッピーパス) ---
  it('正常に画像が保存され、署名付きURLが返される', async () => {
    const testFile = new File(['dummy content'], 'test.png', {
      type: 'image/png',
    });
    const mockSignedUrl = 'http://supabase.com/signed-url-for/test.png';
    const mockFilePath = 'images/mock-path/test.png';

    // `upload`が成功した時の戻り値を設定
    mockUpload.mockResolvedValue({
      data: { path: mockFilePath },
      error: null,
    });
    // `createSignedUrl`が成功した時の戻り値を設定
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: mockSignedUrl },
      error: null,
    });

    const result = await saveImageAndGetUrl(testFile);

    // 結果が期待通りか検証
    expect(result).toBe(mockSignedUrl);
    // どのメソッドが正しい引数で呼び出されたか検証
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(mockUpload).toHaveBeenCalledWith(expect.any(String), testFile); // 第1引数は動的なので型だけチェック
    expect(mockCreateSignedUrl).toHaveBeenCalledWith(
      mockFilePath,
      expect.any(Number),
    );
  });

  // --- 4. アップロードに失敗する場合 ---
  it('画像のアップロードに失敗した場合、エラーをスローする', async () => {
    const testFile = new File(['dummy content'], 'failure.png');
    const uploadError = new Error('Supabase upload failed');

    // `upload`が失敗した時の戻り値を設定
    mockUpload.mockResolvedValue({
      data: null,
      error: uploadError,
    });

    // saveImageAndGetUrlを実行すると、指定したエラーがスローされることを検証
    await expect(saveImageAndGetUrl(testFile)).rejects.toThrow(
      '画像のアップロードに失敗しました。',
    );

    // uploadは呼ばれるが、createSignedUrlは呼ばれないことを確認
    expect(mockUpload).toHaveBeenCalled();
    expect(mockCreateSignedUrl).not.toHaveBeenCalled();
  });

  // --- 5. 署名付きURLの生成に失敗する場合 ---
  it('署名付きURLの生成に失敗した場合、エラーをスローする', async () => {
    const testFile = new File(['dummy content'], 'failure.png');
    const signedUrlError = new Error('Signed URL creation failed');

    // `upload`は成功させる
    mockUpload.mockResolvedValue({
      data: { path: 'some/path' },
      error: null,
    });
    // `createSignedUrl`が失敗した時の戻り値を設定
    mockCreateSignedUrl.mockResolvedValue({
      data: null,
      error: signedUrlError,
    });

    await expect(saveImageAndGetUrl(testFile)).rejects.toThrow(
      '画像URLの生成に失敗しました。',
    );
  });
});
