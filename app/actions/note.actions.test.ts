import { describe, it, expect, vi, beforeEach } from 'vitest';
// テスト対象のActionと、spyOnで使うためのモジュール全体をインポート
import { createNoteAction, deleteNoteAction } from './note.actions';
import * as noteActions from './note.actions';
import { auth0 } from '@/lib/auth0';
import * as noteService from '@/lib/noteService';
import { createNote } from '@/lib/noteService';

// --- モックの設定 ---
// Actionが依存している「外部」モジュールだけをモックする
vi.mock('@/lib/auth0');
vi.mock('@/lib/noteService');

// saveImageAndGetUrlをモック
vi.mock('./note.actions', async (importOriginal) => {
  // 元のモジュールを動的にインポートする
  const originalModule = await importOriginal<typeof noteActions>();
  return {
    // スプレッド構文で、元のモジュールのエクスポートを全て展開
    // これにより、createNoteAction などは本物の実装が使われる
    ...originalModule,

    // saveImageAndGetUrl だけを、モック関数で上書きする
    saveImageAndGetUrl: vi
      .fn()
      .mockResolvedValue('https://mocked.com/image-from-mock.jpg'),
  };
});

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

// Next.jsのキャッシュ機能をモック化し、何もしないようにする
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// --- テスト本体 ---
describe('Note Actions', () => {
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    // restoreAllMocksで、spyOnで上書きした実装も元に戻す
    vi.restoreAllMocks();
  });

  // === createNoteActionのテスト ===
  describe('createNoteAction', () => {
    it('認証済みで画像がない場合、正しい引数でcreateNoteを呼び出すこと', async () => {
      // 準備：認証済みユーザーをシミュレート
      vi.mocked(auth0.getSession).mockResolvedValue({
        user: { sub: mockUserId },
      } as any);
      // 準備：saveImageAndGetUrlが呼ばれないので、undefinedを返すようにスパイを設定
      vi.spyOn(noteActions, 'saveImageAndGetUrl').mockResolvedValue(undefined);

      const formData = new FormData();
      formData.append('title', 'アクションのテスト');
      formData.append('content', 'テスト内容');
      formData.append('image', new File([], 'empty.png'));

      // 実行
      await noteActions.createNoteAction(formData);

      // 検証
      expect(noteService.createNote).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          title: 'アクションのテスト',
          imageUrl: undefined,
        }),
      );
    });

    it('画像が提供された場合、画像のURLと共にcreateNoteを呼び出す', async () => {
      // --- Arrange (準備) ---
      vi.mocked(auth0.getSession).mockResolvedValue({
        user: { sub: mockUserId },
      } as any);
      // ★ 本題：saveImageAndGetUrlをモックする
      // `noteActions`オブジェクトの`saveImageAndGetUrl`関数をスパイ（監視）し、
      // 動作を「指定したURLを返すPromise」に書き換える

      vi.mock('@/lib/noteService', () => ({
        createNote: vi.fn(), // 呼び出しを監視できる空の関数にする
      }));
      // テスト用のファイルとフォームデータを作成
      const testFile = new File(['dummy content'], 'test.png', {
        type: 'image/png',
      });
      const formData = new FormData();
      formData.append('title', 'テストタイトル');
      formData.append('content', 'テストコンテント');
      formData.append('image', testFile);

      // --- Act (実行) ---
      await noteActions.createNoteAction(formData);

      // --- Assert (検証) ---

      // 1. 画像保存関数が呼び出されたか
      //   expect(saveImageSpy).toHaveBeenCalledWith(testFile);

      // 2. createNoteが正しい引数で呼び出されたか
      expect(createNote).toHaveBeenCalledWith(
        'test-user-123', // モックしたユーザーID
        {
          title: 'テストタイトル',
          content: 'テストコンテント',
          imageUrl: 'https://mocked.com/image.jpg', // ★モックしたURL
        },
      );
    });

    // it('認証済みで画像がある場合、画像のURLと共にcreateNoteを呼び出すこと', async () => {
    //   // 準備：認証済みユーザーをシミュレート
    //   vi.mocked(auth0.getSession).mockResolvedValue({
    //     user: { sub: mockUserId },
    //   } as any);
    //   // ★★★ spyOnを使って、saveImageAndGetUrlだけを上書き ★★★
    //   const mockImageUrl = 'http://example.com/uploaded.png';
    //   mockSaveImageAndGetUrl.mockResolvedValue(mockImageUrl);

    //   const testFile = new File(['test'], 'test.png');
    //   const formData = new FormData();
    //   formData.append('title', '画像付きテスト');
    //   formData.append('image', testFile);

    //   // 実行
    //   await createNoteAction(formData);

    //   // 検証
    //   expect(mockSaveImageAndGetUrl).toHaveBeenCalledWith(testFile);
    //   expect(noteService.createNote).toHaveBeenCalledWith(
    //     mockUserId,
    //     expect.objectContaining({ imageUrl: mockImageUrl }),
    //   );
    // });

    it('未認証の場合、エラーをスローすること', async () => {
      vi.mocked(auth0.getSession).mockResolvedValue(null);
      const formData = new FormData();

      await expect(noteActions.createNoteAction(formData)).rejects.toThrow(
        'ユーザーが認証されていません。ログインしてください。',
      );
    });
  });

  // === deleteNoteActionのテスト ===
  //   describe('deleteNoteAction', () => {
  //     it('認証済みの場合、正しいIDでdeleteNoteを呼び出すこと', async () => {
  //       // 準備：認証済みユーザー
  //       vi.mocked(auth0.getSession).mockResolvedValue({
  //         user: { sub: mockUserId },
  //       } as any);
  //       const noteIdToDelete = 999;

  //       // 実行
  //       await deleteNoteAction(noteIdToDelete);

  //       // 検証
  //       expect(noteService.deleteNote).toHaveBeenCalledTimes(1);
  //       expect(noteService.deleteNote).toHaveBeenCalledWith(
  //         noteIdToDelete,
  //         mockUserId,
  //       );
  //     });
  //   });
});
