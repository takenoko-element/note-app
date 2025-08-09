// app/notes/components/NoteContaner.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NoteContainer } from './NoteContainer';
import { ReactNode } from 'react';
import userEvent from '@testing-library/user-event';

import * as noteActions from '@/app/actions/note.actions';

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

// auth0のモック
vi.mock('@/lib/auth0', () => ({
  auth0: {
    getSession: vi.fn().mockResolvedValue({
      user: {
        sub: 'test-user-id-123', // テスト用のダミーユーザーID
        name: 'Test User',
        email: 'test@example.com',
      },
    }),
  },
}));

// Actionモジュールをモック化
vi.mock('@/app/actions/note.actions', async (importOriginal) => {
  // 元のモジュールも一部利用したい場合は importOriginal() で取得できる
  const original = await importOriginal<typeof noteActions>();
  return {
    ...original, // getNoteByIdなど他の関数は元のまま使う
    // 今回テストしたい関数だけを上書きする
    getAllNotesAction: vi.fn(),
    createNoteAction: vi.fn(),
    deleteNoteAction: vi.fn(),
  };
});

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
// プロパティの一部の型の変換
const initialMockNotes = mockNotes.map((notes) => ({
  ...notes,
  createdAt: notes.createdAt.toISOString(),
  updatedAt: notes.updatedAt.toISOString(),
}));

// React QueryのテストにはQueryClientProviderが必須
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // テストではリトライを無効にすると便利
      },
    },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  Wrapper.displayName = 'QueryClientWrapper';
  return Wrapper;
};

describe('NoteContainer with MSW', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. 表示テスト
  it('ノートを正常に取得・表示し、削除できること', async () => {
    const Wrapper = createWrapper();

    render(<NoteContainer initialNotes={initialMockNotes} />, {
      wrapper: Wrapper,
    });

    // screen.debug(undefined, Infinity);

    // この後の検証でテストが失敗する
    expect(await screen.findByText('MSWのテスト')).toBeInTheDocument();
    expect(screen.getByText(/2番目のノートです/i)).toBeInTheDocument();
  });

  // 2. 新規作成テスト
  it('新しいノートを作成後、ノート一覧にそのノートが追加されること', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();
    render(<NoteContainer initialNotes={[...initialMockNotes]} />, {
      wrapper: Wrapper,
    });

    const newNote = {
      id: 3,
      title: '新しいノート',
      content: 'テストで追加しました。',
      imageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'user123',
    };

    // --- モックの設定 ---
    // createNoteActionが成功したことにする
    vi.mocked(noteActions.createNoteAction).mockResolvedValue();
    // 作成後のデータ再取得では、新しいノートが含まれた配列を返すように設定
    vi.mocked(noteActions.getAllNotesAction).mockResolvedValue([
      ...mockNotes,
      newNote,
    ]);

    // --- ユーザー操作のシミュレーション ---
    // フォームに入力
    await user.type(screen.getByPlaceholderText('タイトル'), newNote.title);
    await user.type(screen.getByPlaceholderText('内容'), newNote.content);
    // 作成ボタンをクリック
    await user.click(screen.getByRole('button', { name: /作成/ }));

    // --- 結果の検証 ---
    // createNoteActionが呼ばれたことを確認
    await waitFor(() => {
      expect(noteActions.createNoteAction).toHaveBeenCalled();
    });
    // UIが更新され、新しいノートが表示されるのを待つ
    expect(await screen.findByText(newNote.title)).toBeInTheDocument();
  });

  // 3. 削除テスト
  it('ノートを削除後、ノート一覧からそのノートが消えること', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();
    render(<NoteContainer initialNotes={[...initialMockNotes]} />, {
      wrapper: Wrapper,
    });

    const noteToDelete = mockNotes[0]; // 最初のノートを削除対象とする

    // --- モックの設定 ---
    // deleteNoteActionが成功したことにする
    vi.mocked(noteActions.deleteNoteAction).mockResolvedValue();
    // 削除後のデータ再取得では、削除されたノートが"ない"配列を返すように設定
    const notesAfterDelete = mockNotes.filter((n) => n.id !== noteToDelete.id);
    vi.mocked(noteActions.getAllNotesAction).mockResolvedValue(
      notesAfterDelete,
    );

    // --- ユーザー操作のシミュレーション ---
    // 削除ボタンをクリック（複数の削除ボタンから最初のものを選択）
    const deleteButtons = await screen.findAllByRole('button', {
      name: /削除/,
    });
    await user.click(deleteButtons[0]);

    // --- 結果の検証 ---
    // deleteNoteActionが正しいIDで呼ばれたか確認
    await waitFor(() => {
      expect(noteActions.deleteNoteAction).toHaveBeenCalledWith(
        noteToDelete.id,
      );
    });

    // UIが更新され、ノートがDOMから消えるのを待つ
    await waitFor(() => {
      expect(screen.queryByText(noteToDelete.title)).not.toBeInTheDocument();
    });

    // もう一方のノートは残っていることを確認
    expect(screen.getByText('2番目のノートです')).toBeInTheDocument();
  });
});
