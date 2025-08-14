// app/page.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NotePage from './page'; // テスト対象のServer Component
import { auth0 } from '@/lib/auth0';
import { getAllNotesAction } from '@/app/actions/note.actions';
import { Note } from '@/types';

// --- モジュールのモック設定 ---
vi.mock('@/lib/auth0');
vi.mock('@/app/actions/note.actions');

// NoteContainerの振る舞いをシンプルにモックする
vi.mock('./notes/components/NoteContainer', () => ({
  NoteContainer: ({ initialNotes }: { initialNotes: Note[] }) => (
    <div data-testid="note-container">
      {initialNotes.map((note) => (
        <div key={note.id}>{note.title}</div>
      ))}
    </div>
  ),
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
    title: 'サーバーコンポーネントのテスト',
    content: '内容1',
    createdAt: new Date(),
    updatedAt: new Date(),
    imageUrl: null,
    userId: 'user-123',
  },
];

// --- テスト本体 ---
describe('NotePage (Server Component)', () => {
  const mockedGetSession = vi.mocked(auth0.getSession);
  const mockedGetAllNotes = vi.mocked(getAllNotesAction);

  // 1. ログアウト状態のテスト
  it('ユーザーがログインしていない場合、ログインを促すメッセージが表示されること', async () => {
    // 準備: getSessionがnullを返す（=未ログイン）状態をシミュレート
    mockedGetSession.mockResolvedValue(null);

    // 実行: Server ComponentはPromiseを返すので、awaitで解決結果を受け取る
    const PageComponent = await NotePage();
    render(PageComponent);

    // 検証
    expect(
      screen.getByText('ノートの作成・閲覧にはログインしてください。'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'ログイン' })).toBeInTheDocument();
  });

  // 2. ログイン状態でノートがある場合のテスト
  it('ユーザーがログインしており、ノートが存在する場合、ノート一覧が表示されること', async () => {
    // 準備: ログインしている状態をシミュレート
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedGetSession.mockResolvedValue({ user: { sub: 'user-123' } } as any);
    // 準備: getAllNotesActionがノートの配列を返すように設定
    mockedGetAllNotes.mockResolvedValue(mockNotes);

    const PageComponent = await NotePage();
    render(PageComponent);

    // 検証
    // NoteContainerのモックが表示するはずのノートタイトルで確認
    expect(
      screen.getByText('サーバーコンポーネントのテスト'),
    ).toBeInTheDocument();
    // ログインボタンは表示されていないはず
    expect(
      screen.queryByRole('link', { name: 'ログイン' }),
    ).not.toBeInTheDocument();
  });

  // 3. ログイン状態でノートがない場合のテスト
  it('ユーザーがログインしているが、ノートが存在しない場合、空のコンテナが表示されること', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedGetSession.mockResolvedValue({ user: { sub: 'user-123' } } as any);
    // 準備: getAllNotesActionが空の配列を返すように設定
    mockedGetAllNotes.mockResolvedValue([]);

    const PageComponent = await NotePage();
    render(PageComponent);

    // 検証
    const container = screen.getByTestId('note-container');
    // NoteContainerは表示されるが、中身（ノートタイトル）は空のはず
    expect(container).toBeInTheDocument();
    expect(container.textContent).toBe('');
  });
});
