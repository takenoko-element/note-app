// app/notes/components/NewNoteForm.test.tsx
import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { ComponentProps } from 'react';
import type { DropzoneOptions } from 'react-dropzone';

import { NewNoteForm } from './NewNoteForm';

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

// dropzoneのモック
let onDropCallback: (files: File[]) => void;
vi.mock('react-dropzone', () => ({
  useDropzone: (options: DropzoneOptions) => {
    // コンポーネントから渡されたonDrop関数を、テスト側で使える変数に保存しておく
    onDropCallback = options.onDrop as (files: File[]) => void;
    return {
      getRootProps: vi.fn(() => ({ 'data-testid': 'dropzone-area' })),
      getInputProps: vi.fn(() => ({ 'data-testid': 'dropzone-input' })),
    };
  },
}));

// --- テスト本体 ---
describe('NewNoteForm', () => {
  const user = userEvent.setup();

  // 親から渡される関数の、空のモックを用意
  const mockAddNote = vi.fn();

  beforeEach(() => {
    // 各テストの前に、モックの履歴をクリア
    vi.clearAllMocks();
  });

  // 1. 初期表示のテスト
  it('タイトル、内容の入力欄、作成ボタンが正しく表示されること', () => {
    render(<NewNoteForm addNote={mockAddNote} isAdding={false} />);

    // placeholderテキストを元に入力欄を検索
    expect(screen.getByPlaceholderText('タイトル')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('内容')).toBeInTheDocument();
    // ボタンのテキストでボタンを検索
    expect(screen.getByRole('button', { name: '作成' })).toBeInTheDocument();
  });

  // 2. フォーム入力と送信のテスト
  it('タイトルと内容を入力して作成ボタンを押すと、addNote関数が正しいデータで呼び出されること', async () => {
    render(<NewNoteForm addNote={mockAddNote} isAdding={false} />);

    // --- ユーザー操作のシミュレーション ---
    const titleInput = screen.getByPlaceholderText('タイトル');
    const contentInput = screen.getByPlaceholderText('内容');
    const submitButton = screen.getByRole('button', { name: '作成' });

    // ユーザーがフォームに入力する
    await user.type(titleInput, '新しいテストタイトル');
    await user.type(contentInput, '新しいテスト内容です。');

    // ユーザーが作成ボタンをクリックする
    await user.click(submitButton);

    // --- 結果の検証 ---
    await waitFor(() => {
      // addNote関数が1回だけ呼び出されたことを確認
      expect(mockAddNote).toHaveBeenCalledTimes(1);

      // addNote関数に渡された引数（FormData）をチェックする
      // getMockCallsで呼び出し時の引数を取得できる
      const formData = mockAddNote.mock.calls[0][0] as FormData;
      expect(formData.get('title')).toBe('新しいテストタイトル');
      expect(formData.get('content')).toBe('新しいテスト内容です。');
    });
  });

  // 3. 送信中の状態のテスト
  it('isAddingがtrueのとき、入力欄とボタンが無効化されること', () => {
    render(<NewNoteForm addNote={mockAddNote} isAdding={true} />);

    // isAddingプロパティがtrueで渡された場合、各要素は無効化(disabled)されているはず
    expect(screen.getByPlaceholderText('タイトル')).toBeDisabled();
    expect(screen.getByPlaceholderText('内容')).toBeDisabled();
    expect(screen.getByRole('button', { name: '作成' })).toBeDisabled();
  });

  // 4. バリデーションのテスト
  it('何も入力せずに作成ボタンを押すと、エラーメッセージが表示され、addNoteは呼び出されないこと', async () => {
    render(<NewNoteForm addNote={mockAddNote} isAdding={false} />);
    const submitButton = screen.getByRole('button', { name: '作成' });

    await user.click(submitButton);
    expect(await screen.findByText('タイトルは必須です。')).toBeInTheDocument();
    expect(await screen.findByText('内容は必須です。')).toBeInTheDocument();

    // addNote関数は呼び出されないはず
    expect(mockAddNote).not.toHaveBeenCalled();
  });

  // 5. 画像プレビューのテスト
  it('画像ファイルを選択すると、プレビューが表示されること', async () => {
    render(<NewNoteForm addNote={mockAddNote} isAdding={false} />);

    // --- 準備 ---
    // テスト用のダミーファイルオブジェクトを作成
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });

    // --- 操作 ---
    // 保存しておいたonDropコールバックを、テストから直接呼び出す！
    // これで、ファイルがドロップされたのと同じ状況を作り出せる
    // テスト安定化のためにactでラップし、処理がすべて完了するのを待つ
    act(() => {
      onDropCallback([file]);
    });

    // --- 結果の検証 ---
    const previewImage = await screen.findByRole('img', {
      name: /プレビュー/i,
    });
    expect(previewImage).toBeInTheDocument();
  });

  // 6. 画像クリア機能のテスト
  it('画像のプレビュー表示後、「画像をクリア」ボタンでプレビューが消えること', async () => {
    render(<NewNoteForm addNote={mockAddNote} isAdding={false} />);

    // --- 準備 ---
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });

    // --- 操作 ---
    act(() => {
      onDropCallback([file]);
    });

    const previewImage = await screen.findByRole('img', {
      name: /プレビュー/i,
    });
    expect(previewImage).toBeInTheDocument();

    // --- テスト1：「画像をクリア」ボタンが表示されているか ---
    const clearButton = screen.getByRole('button', { name: /画像をクリア/i });
    expect(clearButton).toBeInTheDocument();

    // --- テスト2：クリアボタンをクリックするとプレビューが消えるか ---
    // クリアボタンを押す前はプレビュー画像が存在したことの確認
    expect(
      screen.queryByRole('img', { name: /プレビュー/i }),
    ).toBeInTheDocument();

    await act(async () => {
      await user.click(clearButton);
    });

    // プレビュー画像がDOMから消えたことを確認
    // queryBy... は要素が見つからない場合にnullを返すので、「ないこと」の確認に最適
    expect(
      screen.queryByRole('img', { name: /プレビュー/i }),
    ).not.toBeInTheDocument();
  });
});
