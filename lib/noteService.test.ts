// lib/noteService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '@/lib/prisma';
import {
  getAllNotes,
  createNote,
  updateNote,
  deleteNote,
  getNoteById,
} from './noteService';
import { auth0 } from './auth0';
import { findOrCreateUser } from './userService';
import * as imageService from './image.service';

// --- モジュールのモック設定 ---
// Prisma Clientをモック化
vi.mock('@/lib/prisma', () => ({
  default: {
    note: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    // userモデルも必要に応じてモック
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// noteServiceが依存している他のモジュールもモック
vi.mock('./auth0');
vi.mock('./userService');
vi.mock('./image.service');

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

// --- テストデータ ---
const mockUserId = 'user123';
const otherUserId = 'user999';
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
  {
    id: 3,
    title: 'Non imageのテスト',
    content: '3番目のノートです',
    imageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'user123',
  },
];

// --- テスト本体 ---
describe('noteService', () => {
  const mockedPrismaNote = vi.mocked(prisma.note);
  const mockedFindOrCreateUser = vi.mocked(findOrCreateUser);
  const mockedGetSession = vi.mocked(auth0.getSession);
  const mockedGetSignedUrl = vi.mocked(imageService.getSignedUrl);

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // --- getAllNotesのテスト ---
  // 1. 指定ユーザーの全ノートの取得確認
  it('getAllNotesは、指定されたユーザーIDのノートをすべて返す（imageUrlは証明書付きURLに置き換わっている）', async () => {
    const mockSignedUrl1 = 'http://supabase.com/signed/image1.jpg';
    const mockSignedUrl2 = 'http://supabase.com/signed/image2.jpg';
    const mockSignedUrl3 = 'http://supabase.com/signed/image3.jpg';
    // 呼び出されるたびに異なる値を返すように設定
    mockedGetSignedUrl
      .mockResolvedValueOnce(mockSignedUrl1)
      .mockResolvedValueOnce(mockSignedUrl2)
      .mockResolvedValueOnce(mockSignedUrl3);

    const notesFromDb = structuredClone(mockNotes);
    mockedPrismaNote.findMany.mockResolvedValue(notesFromDb);
    const resultNotes = await getAllNotes(mockUserId);

    expect(mockedGetSignedUrl).toHaveBeenCalledTimes(2); // 画像データのある2件分だけ実行される
    expect(mockedGetSignedUrl).toHaveBeenCalledWith(mockNotes[0].imageUrl);
    expect(mockedGetSignedUrl).toHaveBeenCalledWith(mockNotes[1].imageUrl);
    expect(mockedGetSignedUrl).not.toHaveBeenCalledWith(mockNotes[2].imageUrl);
    expect(mockedPrismaNote.findMany).toHaveBeenCalledWith({
      where: { userId: mockUserId },
      orderBy: { createdAt: 'desc' },
    });

    expect(resultNotes[0].imageUrl).toBe(mockSignedUrl1);
    expect(resultNotes[1].imageUrl).toBe(mockSignedUrl2);
    expect(resultNotes[2].imageUrl).not.toBe(mockSignedUrl3);
    // タイトルなど他のプロパティは元のままであることを確認
    expect(resultNotes[0].title).toBe(mockNotes[0].title);

    expect(resultNotes).not.toEqual(mockNotes);
  });

  // 2. 指定ユーザーの指定ノートの取得確認
  it('getNoteByIdは、指定されたユーザーIDの指定されたIDのノートを返す（imageUrlは証明書付きURLに置き換わっている）', async () => {
    const mockSignedUrl = 'http://supabase.com/signed/image.jpg';
    mockedGetSignedUrl.mockResolvedValue(mockSignedUrl);

    const notesFromDb = structuredClone(mockNotes);
    mockedPrismaNote.findUnique.mockResolvedValue(notesFromDb[0]);

    const resultNote = await getNoteById(
      notesFromDb[0].id,
      notesFromDb[0].userId,
    );

    expect(mockedGetSignedUrl).toHaveBeenCalledTimes(1);
    expect(mockedGetSignedUrl).toHaveBeenCalledWith(mockNotes[0].imageUrl);
    expect(resultNote!.imageUrl).toBe(mockSignedUrl);

    expect(mockedPrismaNote.findUnique).toHaveBeenCalledWith({
      where: { id: mockNotes[0].id, userId: mockNotes[0].userId },
    });
    expect(resultNote!.title).toBe(mockNotes[0].title);
    expect(resultNote).not.toEqual(mockNotes[0]);
  });

  // 3. 指定ユーザーの指定ノートの取得確認(指定ノートが存在しなかった場合)
  it('getNoteByIdは、指定されたユーザーIDの指定されたIDが存在しなかった場合nullを返す', async () => {
    mockedPrismaNote.findUnique.mockResolvedValue(null);
    const notes = await getNoteById(mockNotes[0].id, mockNotes[0].userId);
    expect(notes).toEqual(null);
    expect(mockedPrismaNote.findUnique).toHaveBeenCalledWith({
      where: { id: mockNotes[0].id, userId: mockNotes[0].userId },
    });
  });

  // 4. 画像データのないノートの取得確認
  it('getNoteByIdは、画像データのないノートは証明書付き画像URLの置き換えを行わない', async () => {
    const mockSignedUrl = 'http://supabase.com/signed/image.jpg';
    mockedGetSignedUrl.mockResolvedValue(mockSignedUrl);

    const nonImageNoteFromDb = structuredClone(mockNotes[2]);
    mockedPrismaNote.findUnique.mockResolvedValue(nonImageNoteFromDb);

    const resultNote = await getNoteById(
      nonImageNoteFromDb.id,
      nonImageNoteFromDb.userId,
    );

    expect(mockedGetSignedUrl).toHaveBeenCalledTimes(0);
    expect(resultNote!.imageUrl).toBe(mockNotes[2].imageUrl); // null

    expect(resultNote).toEqual(mockNotes[2]);
  });

  // --- createNoteのテスト ---
  describe('createNote', () => {
    beforeEach(() => {
      // createNote内のfindOrCreateUserを成功させるための共通モック
      mockedGetSession.mockResolvedValue({
        user: { sub: mockUserId, email: 'test@test.com' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockedFindOrCreateUser.mockResolvedValue({} as any);
    });

    // 5. 有効なデータでノートを正常に作成できる
    it('有効なデータでノートを正常に作成できる', async () => {
      mockedPrismaNote.create.mockResolvedValue(mockNotes[0]);
      const newNoteData = { title: 'New', content: 'Content' };
      const result = await createNote(mockUserId, newNoteData);

      expect(result).toEqual(mockNotes[0]);
      expect(mockedFindOrCreateUser).toHaveBeenCalledTimes(1);
      expect(mockedPrismaNote.create).toHaveBeenCalledWith({
        data: {
          ...newNoteData,
          imageUrl: undefined,
          userId: mockUserId,
        },
      });
    });

    // 6. タイトルが空の場合、エラーをスローする
    it('タイトルが空の場合、エラーをスローする', async () => {
      const invalidData = { title: '  ', content: 'Content' };
      await expect(createNote(mockUserId, invalidData)).rejects.toThrow(
        'タイトルの入力は必須です。',
      );
    });

    // 7. コンテンツが空の場合、エラーをスローする
    it('コンテンツが空の場合、エラーをスローする', async () => {
      const invalidData = { title: 'Title', content: '  ' };
      await expect(createNote(mockUserId, invalidData)).rejects.toThrow(
        'コンテンツの入力は必須です。',
      );
    });

    // 8. 欠陥ユーザー情報(userId=null)での呼び出し時の処理
    it('userIdが空の場合、findOrCreateUserが呼び出されない', async () => {
      mockedGetSession.mockResolvedValue({
        user: { sub: null, email: 'test@test.com' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const newNoteData = { title: 'New', content: 'Content' };
      await createNote(mockUserId, newNoteData);

      expect(mockedFindOrCreateUser).toHaveBeenCalledTimes(0);
    });

    // 9. 欠陥ユーザー情報(email=null)での呼び出し時の処理
    it('emailが空の場合、findOrCreateUserが呼び出されない', async () => {
      mockedGetSession.mockResolvedValue({
        user: { sub: mockUserId, email: null },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const newNoteData = { title: 'New', content: 'Content' };
      await createNote(mockUserId, newNoteData);

      expect(mockedFindOrCreateUser).toHaveBeenCalledTimes(0);
    });
  });

  // --- updateNoteのテスト ---
  describe('updateNote', () => {
    // 10. 自分のノートを正常に更新できる
    it('自分のノートを正常に更新できる', async () => {
      // 準備: findUniqueで自分のノートが返されるように設定
      mockedPrismaNote.findUnique.mockResolvedValue(mockNotes[0]);
      mockedPrismaNote.update.mockResolvedValue({
        ...mockNotes[0],
        title: 'Updated',
      });

      const updateData = { title: 'Updated', content: 'New Content' };
      const result = await updateNote(
        mockNotes[0].id,
        mockNotes[0].userId,
        updateData,
      );

      expect(result.title).toBe('Updated');
      expect(mockedPrismaNote.update).toHaveBeenCalledWith({
        where: { id: mockNotes[0].id },
        data: updateData,
      });
    });

    // 11. 他人のノートを更新しようとすると、エラーをスローする
    it('他人のノートを更新しようとすると、エラーをスローする', async () => {
      // 準備: findUniqueで他人のノートが返されるように設定
      const otherNote = { ...mockNotes[0], userId: otherUserId };
      mockedPrismaNote.findUnique.mockResolvedValue(otherNote);

      const updateData = { title: 'Hacking', content: '...' };
      await expect(
        updateNote(mockNotes[0].id, mockNotes[0].userId, updateData),
      ).rejects.toThrow('更新権限のないノートです。');
    });

    // 12. ノートが見つからなかった場合、エラーをスローする
    it('ノートが見つからなかった場合、エラーをスローする', async () => {
      // 準備: findUniqueで他人のノートが返されるように設定
      mockedPrismaNote.findUnique.mockResolvedValue(null);

      await expect(
        updateNote(mockNotes[0].id, mockNotes[0].userId, mockNotes[0]),
      ).rejects.toThrow('更新権限のないノートです。');
    });

    // 13. タイトルが空の場合、エラーをスローする
    it('タイトルが空の場合、エラーをスローする', async () => {
      const updateData = { title: '  ', content: 'Content' };
      await expect(
        updateNote(mockNotes[0].id, mockNotes[0].userId, updateData),
      ).rejects.toThrow('タイトルの入力は必須です。');
    });

    // 14. コンテンツが空の場合、エラーをスローする
    it('コンテンツが空の場合、エラーをスローする', async () => {
      const updateData = { title: 'Title', content: '  ' };
      await expect(
        updateNote(mockNotes[0].id, mockNotes[0].userId, updateData),
      ).rejects.toThrow('コンテンツの入力は必須です。');
    });
  });

  // --- deleteNoteのテスト ---
  describe('deleteNote', () => {
    // 15. 自分のノートを正常に削除できる
    it('自分のノートを正常に削除できる', async () => {
      mockedPrismaNote.findUnique.mockResolvedValue(mockNotes[0]);
      mockedPrismaNote.delete.mockResolvedValue(mockNotes[0]);

      await deleteNote(mockNotes[0].id, mockNotes[0].userId);

      expect(mockedPrismaNote.delete).toHaveBeenCalledWith({
        where: { id: mockNotes[0].id },
      });
    });

    // 16. 他人のノートを削除しようとすると、エラーをスローする
    it('他人のノートを削除しようとすると、エラーをスローする', async () => {
      const otherNote = { ...mockNotes[0], userId: otherUserId };
      mockedPrismaNote.findUnique.mockResolvedValue(otherNote);

      await expect(deleteNote(mockNotes[0].id, mockUserId)).rejects.toThrow(
        '削除権限のないノートです。',
      );
    });

    // 17. ノートが見つからなかった場合、エラーをスローする
    it('他人のノートを削除しようとすると、エラーをスローする', async () => {
      mockedPrismaNote.findUnique.mockResolvedValue(null);

      await expect(deleteNote(mockNotes[0].id, mockUserId)).rejects.toThrow(
        '削除権限のないノートです。',
      );
    });
  });
});
