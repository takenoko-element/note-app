// app/notes/hooks/useNotes.test.ts
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReactNode } from 'react';
import { toast } from 'sonner';

import { useNotes } from './useNotes';
import * as noteActions from '../../actions/note.actions';
import type { Note } from '@/types';

// --- モジュールのモック設定 ---
vi.mock('../../actions/note.actions');
// sonnerのtoastをモック化
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
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

// --- テストデータ ---
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

// --- テスト用のラッパーコンポーネント ---
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

// --- テスト本体 ---
describe('useNotes Hook', () => {
  // モックされた関数を型安全に扱うための準備
  const mockedGetAllNotesAction = vi.mocked(noteActions.getAllNotesAction);
  const mockedCreateNoteAction = vi.mocked(noteActions.createNoteAction);
  const mockedUpdateNoteAction = vi.mocked(noteActions.updateNoteAction);
  const mockedDeleteNoteAction = vi.mocked(noteActions.deleteNoteAction);
  const mockedToastSuccess = vi.mocked(toast.success);
  const mockedToastError = vi.mocked(toast.error);

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // 1. データ取得 (useQuery) のテスト
  it('初期データを正しく表示し、データの取得に成功するとフックの状態が更新されること', async () => {
    // 準備: Actionが成功してモックデータを返すように設定
    mockedGetAllNotesAction.mockResolvedValue(mockNotes);
    // データ取得時の変換処理をトレースする
    const getMockNotes = mockNotes.map((notes) => ({
      ...notes,
      createdAt: notes.createdAt.toISOString(),
    }));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useNotes(), { wrapper });

    // 初期状態ではデータは空のはず (initialData)
    expect(result.current.isLoading).toBe(true);
    expect(result.current.notes).toBeUndefined();

    // waitForを使って、非同期処理が完了し、状態が更新されるのを待つ
    await waitFor(() => {
      // ローディングが完了し、データが取得されていることを確認
      expect(result.current.isLoading).toBe(false);
      expect(result.current.notes).toEqual(getMockNotes);
    });

    // Actionが呼び出されたことを確認
    expect(mockedGetAllNotesAction).toHaveBeenCalledTimes(1);
  });

  // 2. データ作成 (useMutation) の成功ケースのテスト
  it('addNoteを呼び出すとcreateNoteActionが実行され、成功時にトーストが表示されること', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useNotes(), { wrapper });
    const newNoteFormData = new FormData();
    newNoteFormData.append('title', 'New Note');

    // 準備: Actionが成功したことにする
    mockedCreateNoteAction.mockResolvedValue();

    // actでフックの関数を呼び出す
    act(() => {
      result.current.addNote(newNoteFormData);
    });

    // 成功を待つ
    await waitFor(() => {
      expect(mockedCreateNoteAction).toHaveBeenCalledWith(newNoteFormData);
      expect(mockedToastSuccess).toHaveBeenCalledWith('ノートを作成しました。');
    });
  });

  // 3. データ作成 (useMutation) の失敗ケースのテスト
  it('addNoteを呼び出すとcreateNoteActionが実行され、失敗時にトーストが表示されること', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useNotes(), { wrapper });
    const newNoteFormData = new FormData();
    newNoteFormData.append('title', 'New Note');

    // 準備: Actionが失敗したことにする
    const error = new Error('作成エラー');
    mockedCreateNoteAction.mockRejectedValue(error);

    // actでフックの関数を呼び出す
    act(() => {
      result.current.addNote(newNoteFormData);
    });

    // 失敗を待つ
    await waitFor(() => {
      expect(mockedCreateNoteAction).toHaveBeenCalledWith(newNoteFormData);
      expect(mockedToastError).toHaveBeenCalledWith(error.message);
    });
  });

  // 4. データ削除 (useMutation) の成功ケースのテスト
  it('deleteNoteを呼び出し、成功時にトーストが表示されること', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useNotes(), { wrapper });

    // 準備: Actionが成功したことにする
    mockedDeleteNoteAction.mockResolvedValue();

    act(() => {
      result.current.deleteNote(1);
    });

    await waitFor(() => {
      expect(mockedDeleteNoteAction).toHaveBeenCalledWith(1);
      expect(mockedToastSuccess).toHaveBeenCalledWith('ノートを削除しました。');
    });
  });

  // 5. データ削除 (useMutation) の失敗ケースのテスト
  it('deleteNoteを呼び出し、失敗した場合はエラートーストが表示されること', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useNotes(), { wrapper });
    const error = new Error('削除に失敗しました。');

    // 準備: Actionが失敗したことにする
    mockedDeleteNoteAction.mockRejectedValue(error);

    act(() => {
      result.current.deleteNote(1);
    });

    await waitFor(() => {
      expect(mockedDeleteNoteAction).toHaveBeenCalledWith(1);
      expect(mockedToastError).toHaveBeenCalledWith(error.message);
    });
  });

  // 6. データ更新 (楽観的更新) の成功ケースのテスト
  it('updateNoteを呼び出すと、成功した場合は楽観的更新が維持されること', async () => {
    // Queryのキャッシュを書き換えるため、他に影響しないように独自Wrapperを作成する
    const queryClient = new QueryClient();
    const customWrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    // 準備: 事前にキャッシュにデータを入れておく
    queryClient.setQueryData(['notes'], mockNotes);

    const { result } = renderHook(() => useNotes(), { wrapper: customWrapper });

    const updatedFormData = new FormData();
    updatedFormData.append('title', 'Updated Success Title');
    const noteToUpdate = { id: 1, formData: updatedFormData };

    // 準備: updateNoteActionが成功したことにする
    mockedUpdateNoteAction.mockResolvedValue();

    // --- 実行 ---
    act(() => {
      result.current.updateNote(noteToUpdate);
    });

    // --- 検証 ---
    // onMutateが実行され、UIが即座に更新されたか (楽観的更新)
    await waitFor(() => {
      const notesInCache = queryClient.getQueryData<Note[]>(['notes']);
      expect(notesInCache?.find((n) => n.id === mockNotes[0].id)?.title).toBe(
        'Updated Success Title', // タイトルが更新されている
      );
    });

    // updateNoteActionが正しく呼ばれたか
    await waitFor(() => {
      expect(mockedUpdateNoteAction).toHaveBeenCalledWith(
        noteToUpdate.id,
        noteToUpdate.formData,
      );
      // 成功のトーストは出ない設計なので、エラーが出ていないことを確認
      expect(mockedToastError).not.toHaveBeenCalled();
    });

    // 最終的なキャッシュの状態が楽観的更新後のままであることも確認
    const finalNotes = queryClient.getQueryData<Note[]>(['notes']);
    expect(finalNotes?.find((n) => n.id === mockNotes[0].id)?.title).toBe(
      'Updated Success Title',
    );
  });

  // 7. データ更新 (楽観的更新) の失敗ケースのテスト
  it('updateNoteを呼び出すと、UIが楽観的に更新され、失敗時には元に戻ること', async () => {
    // Queryのキャッシュを書き換えるため、他に影響しないように独自Wrapperを作成する
    const queryClient = new QueryClient();
    const customWrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    // 準備: 事前にキャッシュにデータを入れておく
    queryClient.setQueryData(['notes'], mockNotes);

    const { result } = renderHook(() => useNotes(), { wrapper: customWrapper });

    const updatedFormData = new FormData();
    updatedFormData.append('title', 'Updated Fail Title');
    const noteToUpdate = { id: 1, formData: updatedFormData };

    const error = new Error('更新エラー');
    mockedUpdateNoteAction.mockRejectedValue(error);

    // 非同期な失敗をシミュレートする
    mockedUpdateNoteAction.mockImplementation(() => {
      return new Promise((_, reject) => {
        // 1000ミリ秒後に失敗させることで、テストが中間状態を観測する時間を作る
        setTimeout(() => reject(error), 1000);
      });
    });

    // --- 実行 ---
    act(() => {
      result.current.updateNote(noteToUpdate);
    });

    // --- 検証 ---
    // 1. onMutateが実行され、UIが即座に更新されたか (楽観的更新)
    await waitFor(() => {
      const notesInCache = queryClient.getQueryData<Note[]>(['notes']);
      expect(notesInCache?.find((n) => n.id === mockNotes[0].id)?.title).toBe(
        'Updated Fail Title', // タイトルが更新されている
      );
    });

    // 2. onErrorが実行され、UIが元の状態にロールバックされたか
    await waitFor(() => {
      const notesInCache = queryClient.getQueryData<Note[]>(['notes']);
      expect(notesInCache?.find((n) => n.id === mockNotes[0].id)?.title).toBe(
        mockNotes[0].title, // 元のタイトルに戻っている
      );
      expect(mockedToastError).toHaveBeenCalledWith(error.message);
    });
  });
});
