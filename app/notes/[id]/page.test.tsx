// app/notes/[id]/page.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// generateMetadataとNoteDetailPageを両方インポート
import NoteDetailPage, { generateMetadata } from './page';
import * as noteService from '@/lib/noteService';
import { notFound } from 'next/navigation';
import { ComponentProps } from 'react';
import { auth0 } from '@/lib/auth0';

// --- モジュールのモック設定 ---
vi.mock('@/lib/noteService');

// notFoundは特殊なエラーをスローするので、その振る舞いをモック
vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NOT_FOUND');
  }),
}));

// Next.jsのImageを従来のimgにモック
vi.mock('next/image', () => ({
  default: (props: ComponentProps<'img'> & { fill?: boolean }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { fill, ...rest } = props;
    // next/image に渡されるすべてのプロパティ（src, altなど）を
    // そのまま通常のimgタグに流し込む
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...rest} alt={props.alt} />;
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
const mockNote = {
  id: 1,
  title: '詳細ページのテスト',
  content: 'これがノートの内容です。',
  imageUrl: 'http://example.com/note-image.jpg',
  createdAt: new Date(),
  updatedAt: new Date(),
  userId: 'user-123',
};

const pageProps = { params: { id: '1' } };

// --- テスト本体 ---
describe('Note Detail Page ([id]/page.tsx)', () => {
  const mockedGetNoteById = vi.mocked(noteService.getNoteById);

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // --- generateMetadata 関数のテスト ---
  describe('generateMetadata', () => {
    const mockedGetSession = vi.mocked(auth0.getSession);
    beforeEach(() => {
      vi.restoreAllMocks();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockedGetSession.mockResolvedValue({ user: { sub: 'user-123' } } as any);
    });

    // 1. ノートが見つかった場合の正常表示
    it('ノートが見つかった場合、タイトルにノート名が含まれること', async () => {
      mockedGetNoteById.mockResolvedValue(mockNote);
      const metadata = await generateMetadata(pageProps);
      expect(metadata.title).toBe('詳細ページのテスト | Note App');
    });

    // 2. ノートが見つからなかった場合の表示
    it('ノートが見つからなかった場合、その旨を表示を行うこと', async () => {
      mockedGetNoteById.mockResolvedValue(null);
      const metadata = await generateMetadata(pageProps);
      expect(metadata.title).toBe('ノートが見つかりません');
    });

    // 3. userIdが見つからなかった場合の表示
    it('userIdが見つからなかった場合、デフォルトのタイトルになること', async () => {
      mockedGetNoteById.mockResolvedValue(mockNote);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockedGetSession.mockResolvedValue({ user: { sub: '' } } as any);

      const metadata = await generateMetadata(pageProps);
      expect(metadata.title).toBe('Note App');
    });

    // 4. idが見つからなかった場合の表示
    it('idが数値でなかった場合、デフォルトのタイトルになること', async () => {
      mockedGetNoteById.mockResolvedValue(mockNote);

      const metadata = await generateMetadata({ params: { id: 'abc' } });
      expect(metadata.title).toBe('Note App');
    });
  });

  // --- NoteDetailPage コンポーネントのテスト ---
  describe('NoteDetailPage Component', () => {
    const mockedGetSession = vi.mocked(auth0.getSession);
    beforeEach(() => {
      vi.restoreAllMocks();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockedGetSession.mockResolvedValue({ user: { sub: 'user-123' } } as any);
    });

    // 5. ノートが正常に取得できた場合、ノートの詳細を表示
    it('ノートが正常に取得できた場合、ノートの詳細が表示されること', async () => {
      mockedGetNoteById.mockResolvedValue(mockNote);

      const PageComponent = await NoteDetailPage(pageProps);
      render(PageComponent);

      expect(
        screen.getByRole('heading', { name: '詳細ページのテスト' }),
      ).toBeInTheDocument();
      expect(screen.getByText('これがノートの内容です。')).toBeInTheDocument();
      expect(screen.getByAltText('詳細ページのテスト')).toHaveAttribute(
        'src',
        mockNote.imageUrl,
      );

      // SuspenseでラップされたAiSummaryも最終的に表示される
      // findByを使うと、非同期で表示される要素を待つことができる
      expect(await screen.findByText(/AIによる要約/i)).toBeInTheDocument();
    });

    // 6. ノートが正常に取得できた場合、ノートの詳細を表示
    it('ノートに画像データがない場合、画像が表示されないこと', async () => {
      mockedGetNoteById.mockResolvedValue({ ...mockNote, imageUrl: null });

      const PageComponent = await NoteDetailPage(pageProps);
      render(PageComponent);

      expect(
        screen.queryByRole('img', { name: mockNote.title }),
      ).not.toBeInTheDocument();
    });

    // 7. ノートが見つからなかった場合、NOT_FONDの表示
    it('ノートが見つからなかった場合、notFoundが呼び出されること', async () => {
      mockedGetNoteById.mockResolvedValue(null);

      // notFoundはエラーをスローするので、Promise.rejectsでアサーションする
      await expect(NoteDetailPage(pageProps)).rejects.toThrow('NOT_FOUND');
      expect(vi.mocked(notFound)).toHaveBeenCalled();
    });

    // 8. userIdが見つからなかった場合、NOT_FONDの表示
    it('useIdが見つからなかった場合、notFoundが呼び出されること', async () => {
      mockedGetNoteById.mockResolvedValue(mockNote);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockedGetSession.mockResolvedValue({ user: { sub: '' } } as any);

      await expect(NoteDetailPage(pageProps)).rejects.toThrow('NOT_FOUND');
      expect(vi.mocked(notFound)).toHaveBeenCalled();
    });

    // 9. idが見つからなかった場合、NOT_FONDの表示
    it('idが見つからなかった場合、notFoundが呼び出されること', async () => {
      mockedGetNoteById.mockResolvedValue(mockNote);

      await expect(NoteDetailPage({ params: { id: 'abc' } })).rejects.toThrow(
        'NOT_FOUND',
      );
      expect(vi.mocked(notFound)).toHaveBeenCalled();
    });
  });
});
