import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  createNoteAction,
  deleteNoteAction,
  getAllNotesAction,
  updateNoteAction,
} from '@/app/actions/note.actions';
import { auth0 } from '@/lib/auth0';
import * as noteActions from './note.actions';
import * as noteService from '@/lib/noteService';
import * as imageService from '@/lib/image.service';
import { revalidatePath } from 'next/cache';

// --- モックの設定 ---
// Actionが依存している「外部」モジュールだけをモックする
vi.mock('@/lib/auth0');
vi.mock('@/lib/noteService');
vi.mock('@/lib/image.service');

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

// --- モックデータ ---
const mockNotes = [
  {
    id: 1,
    title: 'MSWのテスト',
    content: '最初のノートです',
    imageUrl: 'http://example.com/image.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'user123',
  },
  {
    id: 2,
    title: 'React Queryのテスト',
    content: '2番目のノートです',
    imageUrl: 'http://example.com/image2.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'user123',
  },
];

// --- テスト本体 ---
describe('Note Actions', () => {
  // モックされた関数を型安全に扱うための準備
  const mockedGetSession = vi.mocked(auth0.getSession);
  const mockedGetAllNotes = vi.mocked(noteService.getAllNotes);
  const mockedCreateNote = vi.mocked(noteService.createNote);
  const mockedUpdateNote = vi.mocked(noteService.updateNote);
  const mockedDeleteNote = vi.mocked(noteService.deleteNote);
  const mockedSaveImage = vi.mocked(imageService.saveImageAndGetPath);
  const mockedRevalidatePath = vi.mocked(revalidatePath);

  const mockUserId = 'test-user-123';
  const mockNoteId = 1;

  // 各テストの前にモックをリセットし、基本的な認証状態を設定します
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // --- 認証エラーのテスト ---
  it('未認証の場合、エラーをスローすること', async () => {
    // 認証されていない状態をシミュレート
    mockedGetSession.mockResolvedValue(null);
    const formData = new FormData();

    await expect(noteActions.createNoteAction(formData)).rejects.toThrow(
      'ユーザーが認証されていません。ログインしてください。',
    );
  });

  // --- getAllNotesActionのテスト ---
  describe('getAllNotesAction', () => {
    it('認証されたユーザーの全ノートを取得し返却する', async () => {
      vi.mocked(auth0.getSession).mockResolvedValue({
        user: { sub: mockUserId },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      mockedGetAllNotes.mockResolvedValue(mockNotes);

      const result = await getAllNotesAction();

      expect(mockedGetAllNotes).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockNotes);
    });
  });

  // --- createNoteActionのテスト ---
  describe('createNoteAction', () => {
    it('認証済みで画像がない場合、正しい引数でcreateNoteを呼び出すこと', async () => {
      // 準備：認証済みユーザーをシミュレート
      vi.mocked(auth0.getSession).mockResolvedValue({
        user: { sub: mockUserId },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      // テスト用のフォームデータを作成
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
          content: 'テスト内容',
          imageUrl: undefined,
        }),
      );
    });

    it('画像が提供された場合、画像のURLと共にcreateNoteを呼び出す', async () => {
      // --- 準備 ---
      vi.mocked(auth0.getSession).mockResolvedValue({
        user: { sub: mockUserId },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      // テスト用のファイルとフォームデータを作成
      const testFile = new File(['dummy content'], 'test.png', {
        type: 'image/png',
      });
      const testImageUrl = 'http://example.com/test.jpg';
      const formData = new FormData();
      formData.append('title', 'テストタイトル');
      formData.append('content', 'テストコンテント');
      formData.append('image', testFile);

      mockedSaveImage.mockResolvedValue(testImageUrl);

      // --- 実行 ---
      await createNoteAction(formData);

      // --- 検証 ---
      // 1. 画像保存関数が呼び出されたか
      expect(mockedSaveImage).toHaveBeenCalledWith(testFile);

      // 2. createNoteが正しい引数で呼び出されたか
      expect(mockedCreateNote).toHaveBeenCalledWith(mockUserId, {
        title: 'テストタイトル',
        content: 'テストコンテント',
        imageUrl: testImageUrl,
      });
    });

    it('createNoteが失敗した場合、エラーがスローされること', async () => {
      // --- 準備 ---
      vi.mocked(auth0.getSession).mockResolvedValue({
        user: { sub: mockUserId },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const formData = new FormData();
      formData.append('title', '失敗するノート');
      formData.append('content', 'エラーテスト');

      // noteService.createNoteがエラーを投げるようにモック
      const dbError = new Error('データベースエラー');
      vi.mocked(noteService.createNote).mockRejectedValue(dbError);

      // --- 実行と検証 ---
      // createNoteActionを実行すると、内部で発生したエラーがそのままスローされることを期待
      await expect(createNoteAction(formData)).rejects.toThrow(
        'データベースエラー',
      );
    });
  });

  // --- updateNoteActionのテスト ---
  describe('updateNoteAction', () => {
    it('imageActionがupdateで新しい画像とノートを渡した場合、saveImageAndGetUrlとupdateNoteが呼び出される', async () => {
      // --- 準備 ---
      vi.mocked(auth0.getSession).mockResolvedValue({
        user: { sub: mockUserId },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const mockFile = new File(['new image'], 'new.png', {
        type: 'image/png',
      });
      const newImageUrl = 'http://example.com/new.png';
      const formData = new FormData();
      formData.append('title', 'タイトル更新');
      formData.append('content', 'コンテンツ更新');
      formData.append('image', mockFile);
      formData.append('imageAction', 'update');

      mockedSaveImage.mockResolvedValue(newImageUrl);

      await updateNoteAction(mockNoteId, formData);

      expect(mockedSaveImage).toHaveBeenCalledWith(mockFile);
      expect(mockedUpdateNote).toHaveBeenCalledWith(mockNoteId, mockUserId, {
        title: 'タイトル更新',
        content: 'コンテンツ更新',
        imageUrl: newImageUrl,
      });
      expect(mockedRevalidatePath).toHaveBeenCalledWith('/');
    });

    it('imageActionがclearの場合、saveImageAndGetUrlは呼び出されない & imageUrlがnull', async () => {
      // --- 準備 ---
      vi.mocked(auth0.getSession).mockResolvedValue({
        user: { sub: mockUserId },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const testFile = new File(['dummy content'], 'test.png', {
        type: 'image/png',
      });
      const formData = new FormData();
      formData.append('title', '更新タイトル');
      formData.append('content', '更新コンテンツ');
      formData.append('image', testFile);
      formData.append('imageAction', 'clear');

      await updateNoteAction(mockNoteId, formData);

      // 画像クリアなのでsaveImageは呼ばれない
      expect(mockedSaveImage).not.toHaveBeenCalled();
      expect(mockedUpdateNote).toHaveBeenCalledWith(mockNoteId, mockUserId, {
        title: '更新タイトル',
        content: '更新コンテンツ',
        imageUrl: null,
      });
      expect(mockedRevalidatePath).toHaveBeenCalledWith('/');
    });

    it('imageActionがkeepの場合、saveImageAndGetUrlは呼び出されない', async () => {
      // --- 準備 ---
      vi.mocked(auth0.getSession).mockResolvedValue({
        user: { sub: mockUserId },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const formData = new FormData();
      formData.append('title', 'キープタイトル');
      formData.append('content', 'キープコンテンツ');
      formData.append('imageAction', 'keep');

      await updateNoteAction(mockNoteId, formData);

      // 画像維持なのでsaveImageは呼ばれない
      expect(mockedSaveImage).not.toHaveBeenCalled();
      // updateDataにimageUrlプロパティが含まれていないことを確認
      expect(mockedUpdateNote).toHaveBeenCalledWith(mockNoteId, mockUserId, {
        title: 'キープタイトル',
        content: 'キープコンテンツ',
      });
      expect(mockedRevalidatePath).toHaveBeenCalledWith('/');
    });

    it('imageActionがupdateでもファイルが空の場合、画像は更新されないこと', async () => {
      // --- 準備 ---
      vi.mocked(auth0.getSession).mockResolvedValue({
        user: { sub: mockUserId },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const formData = new FormData();
      formData.append('title', 'タイトル更新');
      formData.append('content', 'コンテンツ更新');
      // sizeが0の空ファイルを渡す
      formData.append('image', new File([], 'empty.png'));
      formData.append('imageAction', 'update');

      // --- 実行 ---
      await updateNoteAction(mockNoteId, formData);

      // --- 検証 ---
      // saveImageAndGetUrlが呼び出されないことを確認
      expect(mockedSaveImage).not.toHaveBeenCalled();
      // imageUrlプロパティが含まれずにupdateNoteが呼ばれることを確認
      expect(mockedUpdateNote).toHaveBeenCalledWith(
        mockNoteId,
        mockUserId,
        expect.not.objectContaining({ imageUrl: expect.anything() }),
      );
    });
  });

  // --- deleteNoteActionのテスト ---
  describe('deleteNoteAction', () => {
    it('認証済みの場合、正しいIDでdeleteNoteを呼び出すこと', async () => {
      // 準備：認証済みユーザー
      vi.mocked(auth0.getSession).mockResolvedValue({
        user: { sub: mockUserId },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      // 実行
      await deleteNoteAction(mockNoteId);

      // 検証
      expect(mockedDeleteNote).toHaveBeenCalledTimes(1);
      expect(mockedDeleteNote).toHaveBeenCalledWith(mockNoteId, mockUserId);
      expect(mockedRevalidatePath).toHaveBeenCalledWith('/');
    });
  });
});
