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
];

// --- テスト本体 ---
describe('noteService', () => {
  const mockedPrismaNote = vi.mocked(prisma.note);
  const mockedFindOrCreateUser = vi.mocked(findOrCreateUser);
  const mockedGetSession = vi.mocked(auth0.getSession);

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // --- getAllNotesのテスト ---
  // 1. 指定ユーザーの全ノートの取得確認
  it('getAllNotesは、指定されたユーザーIDのノートをすべて返す', async () => {
    mockedPrismaNote.findMany.mockResolvedValue(mockNotes);
    const notes = await getAllNotes(mockUserId);
    expect(notes).toEqual(mockNotes);
    expect(mockedPrismaNote.findMany).toHaveBeenCalledWith({
      where: { userId: mockUserId },
      orderBy: { createdAt: 'desc' },
    });
  });

  // 2. 指定ユーザーの指定ノートの取得確認
  it('getNoteByIdは、指定されたユーザーIDの指定されたIDのノートを返す', async () => {
    mockedPrismaNote.findUnique.mockResolvedValue(mockNotes[0]);
    const notes = await getNoteById(mockNotes[0].id, mockNotes[0].userId);
    expect(notes).toEqual(mockNotes[0]);
    expect(mockedPrismaNote.findUnique).toHaveBeenCalledWith({
      where: { id: mockNotes[0].id, userId: mockNotes[0].userId },
    });
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

    // 4. 有効なデータでノートを正常に作成できる
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

    // 5. タイトルが空の場合、エラーをスローする
    it('タイトルが空の場合、エラーをスローする', async () => {
      const invalidData = { title: '  ', content: 'Content' };
      await expect(createNote(mockUserId, invalidData)).rejects.toThrow(
        'タイトルの入力は必須です。',
      );
    });

    // 6. コンテンツが空の場合、エラーをスローする
    it('コンテンツが空の場合、エラーをスローする', async () => {
      const invalidData = { title: 'Title', content: '  ' };
      await expect(createNote(mockUserId, invalidData)).rejects.toThrow(
        'コンテンツの入力は必須です。',
      );
    });

    // 7. 欠陥ユーザー情報(userId=null)での呼び出し時の処理
    it('userIdが空の場合、findOrCreateUserが呼び出されない', async () => {
      mockedGetSession.mockResolvedValue({
        user: { sub: null, email: 'test@test.com' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const newNoteData = { title: 'New', content: 'Content' };
      await createNote(mockUserId, newNoteData);

      expect(mockedFindOrCreateUser).toHaveBeenCalledTimes(0);
    });

    // 8. 欠陥ユーザー情報(email=null)での呼び出し時の処理
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
    // 9. 自分のノートを正常に更新できる
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

    // 10. 他人のノートを更新しようとすると、エラーをスローする
    it('他人のノートを更新しようとすると、エラーをスローする', async () => {
      // 準備: findUniqueで他人のノートが返されるように設定
      const otherNote = { ...mockNotes[0], userId: otherUserId };
      mockedPrismaNote.findUnique.mockResolvedValue(otherNote);

      const updateData = { title: 'Hacking', content: '...' };
      await expect(
        updateNote(mockNotes[0].id, mockNotes[0].userId, updateData),
      ).rejects.toThrow('更新権限のないノートです。');
    });

    // 11. ノートが見つからなかった場合、エラーをスローする
    it('ノートが見つからなかった場合、エラーをスローする', async () => {
      // 準備: findUniqueで他人のノートが返されるように設定
      mockedPrismaNote.findUnique.mockResolvedValue(null);

      await expect(
        updateNote(mockNotes[0].id, mockNotes[0].userId, mockNotes[0]),
      ).rejects.toThrow('更新権限のないノートです。');
    });

    // 12. タイトルが空の場合、エラーをスローする
    it('タイトルが空の場合、エラーをスローする', async () => {
      const updateData = { title: '  ', content: 'Content' };
      await expect(
        updateNote(mockNotes[0].id, mockNotes[0].userId, updateData),
      ).rejects.toThrow('タイトルの入力は必須です。');
    });

    // 13. コンテンツが空の場合、エラーをスローする
    it('コンテンツが空の場合、エラーをスローする', async () => {
      const updateData = { title: 'Title', content: '  ' };
      await expect(
        updateNote(mockNotes[0].id, mockNotes[0].userId, updateData),
      ).rejects.toThrow('コンテンツの入力は必須です。');
    });
  });

  // --- deleteNoteのテスト ---
  describe('deleteNote', () => {
    // 14. 自分のノートを正常に削除できる
    it('自分のノートを正常に削除できる', async () => {
      mockedPrismaNote.findUnique.mockResolvedValue(mockNotes[0]);
      mockedPrismaNote.delete.mockResolvedValue(mockNotes[0]);

      await deleteNote(mockNotes[0].id, mockNotes[0].userId);

      expect(mockedPrismaNote.delete).toHaveBeenCalledWith({
        where: { id: mockNotes[0].id },
      });
    });

    // 15. 他人のノートを削除しようとすると、エラーをスローする
    it('他人のノートを削除しようとすると、エラーをスローする', async () => {
      const otherNote = { ...mockNotes[0], userId: otherUserId };
      mockedPrismaNote.findUnique.mockResolvedValue(otherNote);

      await expect(deleteNote(mockNotes[0].id, mockUserId)).rejects.toThrow(
        '削除権限のないノートです。',
      );
    });

    // 16. ノートが見つからなかった場合、エラーをスローする
    it('他人のノートを削除しようとすると、エラーをスローする', async () => {
      mockedPrismaNote.findUnique.mockResolvedValue(null);

      await expect(deleteNote(mockNotes[0].id, mockUserId)).rejects.toThrow(
        '削除権限のないノートです。',
      );
    });
  });
});
