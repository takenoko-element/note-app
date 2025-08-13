// app/notes/components/NoteEditForm.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DropzoneOptions } from 'react-dropzone';

import { NoteEditForm } from './NoteEditForm';
import type { Note } from '@/types';
import { act, ComponentProps } from 'react';

// --- モジュールのモック設定 ---
// react-dropzoneをモック化
const mockOpen = vi.fn();
let onDropCallback: (files: File[]) => void;
vi.mock('react-dropzone', () => ({
  useDropzone: (options: DropzoneOptions) => {
    // コンポーネントから渡されたonDrop関数を、テスト側で使える変数に保存しておく
    onDropCallback = options.onDrop as (files: File[]) => void;
    return {
      getRootProps: vi.fn(() => ({ 'data-testid': 'dropzone-area' })),
      getInputProps: vi.fn(() => ({ 'data-testid': 'dropzone-input' })),
      open: mockOpen,
    };
  },
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
const mockNote: Note = {
  id: 1,
  title: 'テストタイトル',
  content: 'テストコンテンツ',
  imageUrl: 'http://example.com/image.jpg',
  createdAt: new Date().toISOString(),
};

// --- テスト本体 ---
describe('NoteEditForm Component', () => {
  const user = userEvent.setup();
  // 親から渡される関数のモック
  const mockOnDrop = vi.fn();
  const mockHandleClearImage = vi.fn();
  const mockHandleCancel = vi.fn();
  const mockHandleFormAction = vi.fn();

  // すべてのpropsをまとめたオブジェクト
  const defaultProps = {
    note: mockNote,
    isUpdating: false,
    preview: null,
    onDrop: mockOnDrop,
    handleClearImage: mockHandleClearImage,
    handleCancel: mockHandleCancel,
    handleFormAction: mockHandleFormAction,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // --- 初期表示のテスト ---
  // 1. 画像なしの場合の初期表示のテスト
  it('渡されたノートの情報(画像なし)が初期値としてフォームに表示されること', () => {
    render(<NoteEditForm {...defaultProps} />);

    // defaultValueを持つ要素を検証
    expect(screen.getByDisplayValue('テストタイトル')).toBeInTheDocument();
    expect(screen.getByDisplayValue('テストコンテンツ')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '画像を選択' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '画像をクリア' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'キャンセル' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument();
  });

  // 2. 画像ありの場合の初期表示のテスト
  it('previewプロップにURLが渡された場合、プレビュー画像が表示されること', () => {
    render(
      <NoteEditForm
        {...defaultProps}
        preview="http://example.com/preview.jpg"
      />,
    );

    const image = screen.getByRole('img', { name: /プレビュー/i });
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'http://example.com/preview.jpg');
    expect(screen.getByDisplayValue('テストタイトル')).toBeInTheDocument();
    expect(screen.getByDisplayValue('テストコンテンツ')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '画像を選択' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '画像をクリア' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'キャンセル' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument();
  });

  // --- ユーザー操作のテスト ---
  // 3. キャンセルボタンのテスト
  it('キャンセルボタンをクリックすると、handleCancelが呼び出されること', async () => {
    render(<NoteEditForm {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: 'キャンセル' }));
    expect(mockHandleCancel).toHaveBeenCalledTimes(1);
  });

  // 4. 保存ボタンのテスト
  it('保存ボタンをクリックすると、handleFormActionが呼び出されること', async () => {
    render(<NoteEditForm {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(mockHandleFormAction).toHaveBeenCalledTimes(1);
    // FormDataが渡されていることも確認
    expect(mockHandleFormAction).toHaveBeenCalledWith(expect.any(FormData));
  });

  // 5. 画像のクリアボタンのテスト
  it('previewプロップにURLが渡された場合、プレビュー画像が表示されること', async () => {
    render(
      <NoteEditForm
        {...defaultProps}
        preview="http://example.com/preview.jpg"
      />,
    );

    await user.click(screen.getByRole('button', { name: '画像をクリア' }));
    expect(mockHandleClearImage).toHaveBeenCalledTimes(1);
  });

  // 6. 画像選択のテスト(新規)
  it('画像ファイルを選択すると、プレビューが新しい画像に更新されること', async () => {
    render(<NoteEditForm {...defaultProps} />);

    // --- 準備 ---
    // テスト用のダミーファイルオブジェクトを作成
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });

    // --- 操作 ---
    act(() => {
      onDropCallback([file]);
    });

    // --- 結果の検証 ---
    expect(mockOnDrop).toHaveBeenCalledTimes(1);
  });

  // 7. 画像選択のテスト(更新)
  it('画像ファイルを選択すると、プレビューが新しい画像に更新されること', async () => {
    render(
      <NoteEditForm
        {...defaultProps}
        preview="http://example.com/preview.jpg"
      />,
    );

    // --- 準備 ---
    // テスト用のダミーファイルオブジェクトを作成
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });

    // --- 操作 ---
    act(() => {
      onDropCallback([file]);
    });

    // --- 結果の検証 ---
    expect(mockOnDrop).toHaveBeenCalledTimes(1);
  });

  // 8. 「画像を選択」ボタンのテスト
  it('「画像を選択」ボタンをクリックすると、dropzoneのopen関数が呼び出されること', async () => {
    render(<NoteEditForm {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: '画像を選択' }));

    expect(mockOpen).toHaveBeenCalledTimes(1);
  });

  // --- その他のテスト ---
  // 9. ローディング状態のテスト
  it('isUpdatingがtrueの場合、すべての入力とボタンが無効化されること', () => {
    render(
      <NoteEditForm
        {...defaultProps}
        preview="http://example.com/preview.jpg"
        isUpdating={true}
      />,
    );

    expect(screen.getByDisplayValue('テストタイトル')).toBeDisabled();
    expect(screen.getByDisplayValue('テストコンテンツ')).toBeDisabled();
    expect(screen.getByRole('button', { name: '画像を選択' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '画像をクリア' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'キャンセル' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '保存' })).toBeDisabled();
  });
});
