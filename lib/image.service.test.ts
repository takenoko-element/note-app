import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

import { saveImageAndGetPath, getSignedUrl } from '@/lib/image.service';

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

// --- saveImageAndGetPath関数のテスト ---
describe('image.service.ts:saveImageAndGetPath', () => {
  // 各テストの前に、モックの呼び出し履歴などをリセット
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- 1. ファイルがnullの場合 ---
  it('ファイルがnullの場合、undefinedを返しSupabaseクライアントを呼び出さない', async () => {
    const result = await saveImageAndGetPath(null);

    expect(result).toBeUndefined();
    // createClientが呼び出されないことを確認
    expect(createClient).not.toHaveBeenCalled();
  });

  // --- 2. ファイルサイズが0の場合 ---
  it('ファイルサイズが0の場合、undefinedを返しSupabaseクライアントを呼び出さない', async () => {
    const emptyFile = new File([], 'empty.png', { type: 'image/png' });
    const result = await saveImageAndGetPath(emptyFile);

    expect(result).toBeUndefined();
    expect(createClient).not.toHaveBeenCalled();
  });

  // --- 3. 正常にアップロードとURL生成が完了する場合 (ハッピーパス) ---
  it('正常に画像が保存され、ファイルパスが返される', async () => {
    const testFile = new File(['dummy content'], 'test.png', {
      type: 'image/png',
    });
    const mockFilePath = 'images/mock-path/test.png';

    // `upload`が成功した時の戻り値を設定
    mockUpload.mockResolvedValue({
      data: { path: mockFilePath },
      error: null,
    });

    const result = await saveImageAndGetPath(testFile);

    // 結果が期待通りか検証
    expect(result).toBe(mockFilePath);
    // どのメソッドが正しい引数で呼び出されたか検証
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(mockUpload).toHaveBeenCalledWith(expect.any(String), testFile); // 第1引数は動的なので型だけチェック
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
    await expect(saveImageAndGetPath(testFile)).rejects.toThrow(
      '画像のアップロードに失敗しました。',
    );

    expect(mockUpload).toHaveBeenCalled();
  });
});

// --- getSignedUrl関数のテスト ---
describe('image.service.ts:getSignedUrl', () => {
  // 各テストの前に、モックの呼び出し履歴などをリセット
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- 5. 正常にアップロードとURL生成が完了する場合 (ハッピーパス) ---
  it('正常に証明書付きURLを取得でき、URLが返される', async () => {
    const mockSignedUrl = 'http://supabase.com/signed-url-for/test.png';
    const mockFilePath = 'images/mock-path/test.png';

    // `createSignedUrl`が成功した時の戻り値を設定
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: mockSignedUrl },
      error: null,
    });

    const result = await getSignedUrl(mockFilePath);

    // 結果が期待通りか検証
    expect(result).toBe(mockSignedUrl);
    // どのメソッドが正しい引数で呼び出されたか検証
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(mockCreateSignedUrl).toHaveBeenCalledWith(
      mockFilePath,
      expect.any(Number),
    );
  });

  // --- 6. 署名付きURLの生成に失敗する場合 ---
  it('署名付きURLの生成に失敗した場合、nullを返す', async () => {
    const mockFilePath = 'images/mock-path/test.png';
    const signedUrlError = new Error('Signed URL creation failed');

    // `createSignedUrl`が失敗した時の戻り値を設定
    mockCreateSignedUrl.mockResolvedValue({
      data: null,
      error: signedUrlError,
    });
    const result = await getSignedUrl(mockFilePath);

    expect(result).toBeNull();
  });

  // --- 7. ファイルがnullの場合 ---
  it('ファイルパスがnullの場合、nullを返すこと', async () => {
    const result = await getSignedUrl(null);
    expect(result).toBeNull();
    // Supabaseクライアントは呼び出されない
    expect(createClient).not.toHaveBeenCalled();
  });
});
