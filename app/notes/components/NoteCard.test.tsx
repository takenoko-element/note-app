// app/notes/components/NoteCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NoteCard } from './NoteCard';
import { Note } from '@/types';

// モックデータを作成
const mockNote: Note = {
  id: 1,
  title: 'テスト用のノートタイトル',
  content: 'これはテスト用のノート内容です。',
  imageUrl: 'http://example.com/image.jpg',
  createdAt: new Date().toISOString(),
};

describe('NoteCard Component', () => {
  // 1. 基本的なレンダリングのテスト
  it('ノートの情報が正しく表示されること', () => {
    // vi.fn()でモック関数を作成
    const mockUpdateNote = vi.fn();
    const mockDeleteNote = vi.fn();

    render(
      <NoteCard
        note={mockNote}
        updateNote={mockUpdateNote}
        deleteNote={mockDeleteNote}
        isUpdating={false}
        isDeleting={false}
      />,
    );

    // screen.getByTextで指定したテキストを持つ要素を検索
    expect(screen.getByText(mockNote.title)).toBeInTheDocument();
    expect(screen.getByText(mockNote.content)).toBeInTheDocument();

    // 画像が表示されていることをaltテキストで確認
    const image = screen.getByAltText(mockNote.title);
    expect(image).toBeInTheDocument();
    // src属性が正しいか確認
    expect(image).toHaveAttribute('src', expect.stringContaining('image.jpg'));
  });

  // 2. ユーザー操作（イベント）のテスト
  it('編集ボタンをクリックすると、編集モードに切り替わること', () => {
    const mockUpdateNote = vi.fn();
    const mockDeleteNote = vi.fn();

    render(
      <NoteCard
        note={mockNote}
        updateNote={mockUpdateNote}
        deleteNote={mockDeleteNote}
        isUpdating={false}
        isDeleting={false}
      />,
    );

    // "編集" というテキストを持つボタンを取得
    const editButton = screen.getByRole('button', { name: /編集/ });

    // fireEvent.clickでクリックイベントを発生させる
    fireEvent.click(editButton);

    // 編集フォームが表示されることを確認（NoteEditForm内の要素で確認）
    // defaultValueを持つinput要素でタイトル入力欄を検索
    expect(screen.getByDisplayValue(mockNote.title)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockNote.content)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /キャンセル/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /保存/ })).toBeInTheDocument();
  });

  it('削除ボタンをクリックすると、deleteNote関数が正しいIDで呼び出されること', () => {
    const mockUpdateNote = vi.fn();
    const mockDeleteNote = vi.fn();

    render(
      <NoteCard
        note={mockNote}
        updateNote={mockUpdateNote}
        deleteNote={mockDeleteNote}
        isUpdating={false}
        isDeleting={false}
      />,
    );

    const deleteButton = screen.getByRole('button', { name: /削除/ });
    fireEvent.click(deleteButton);

    // mockDeleteNoteが呼び出されたことを確認
    expect(mockDeleteNote).toHaveBeenCalled();
    // 正しいID(mockNote.id)で呼び出されたかを確認
    expect(mockDeleteNote).toHaveBeenCalledWith(mockNote.id);
  });
});
