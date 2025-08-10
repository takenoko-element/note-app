// app/notes/hooks/useNoteCard.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useNoteCard } from './useNoteCard';
import type { Note } from '@/types';

// --- テストデータとモック ---
const mockNote: Note = {
  id: 1,
  title: 'Initial Title',
  content: 'Initial Content',
  imageUrl: 'http://example.com/initial.jpg',
  createdAt: new Date().toISOString(),
};

const mockUpdateNote = vi.fn();

describe('useNoteCard Hook', () => {
  beforeEach(() => {
    // 各テストの前に、モックの履歴をクリア
    vi.clearAllMocks();
  });

  // 1. 初期状態のテスト
  it('初期状態が正しく設定されていること', () => {
    // renderHookでフックをレンダリングし、その返り値を取得
    const { result } = renderHook(() =>
      useNoteCard({ note: mockNote, updateNote: mockUpdateNote }),
    );

    // result.currentで、フックが現在返している値にアクセスできる
    expect(result.current.isEditing).toBe(false);
    expect(result.current.preview).toBe(null);
    expect(result.current.imageAction).toBe('keep');
  });

  // 2. 状態更新のテスト
  it('setIsEditingを呼び出すと、isEditingの状態とpreviewが更新されること', () => {
    const { result } = renderHook(() =>
      useNoteCard({ note: mockNote, updateNote: mockUpdateNote }),
    );

    // act()でフックの状態を更新する関数をラップする
    act(() => {
      result.current.setIsEditing(true);
    });

    // 状態が更新されたかを確認
    expect(result.current.isEditing).toBe(true);
    expect(result.current.preview).toBe(mockNote.imageUrl);
  });

  // 3. onDrop（ファイルドロップ）のテスト
  it('onDropで新しいファイルが渡されると、previewとimageActionが更新されること', () => {
    const { result } = renderHook(() =>
      useNoteCard({ note: mockNote, updateNote: mockUpdateNote }),
    );

    const newFile = new File(['new'], 'new.png', { type: 'image/png' });

    act(() => {
      result.current.onDrop([newFile]);
    });

    // プレビューが新しいファイルのオブジェクトURLに更新されたことを確認
    // URL.createObjectURLは tests/setup.ts でモック済み
    expect(result.current.preview).toContain('blob:');
    expect(result.current.imageAction).toBe('update');
  });

  // 4. フォーム送信のテスト
  it('handleFormActionを呼び出すと、updateNoteが正しいデータで呼び出されること', () => {
    const { result } = renderHook(() =>
      useNoteCard({ note: mockNote, updateNote: mockUpdateNote }),
    );

    // テスト用のFormDataオブジェクトを作成
    const formData = new FormData();
    formData.append('title', 'Updated Title');
    formData.append('content', 'Updated Content');

    act(() => {
      result.current.handleFormAction(formData);
    });

    // updateNoteが1回呼ばれたか
    expect(mockUpdateNote).toHaveBeenCalledTimes(1);

    // 渡された引数を検証
    const calledWith = mockUpdateNote.mock.calls[0][0];
    expect(calledWith.id).toBe(mockNote.id);
    expect(calledWith.formData.get('title')).toBe('Updated Title');
    expect(calledWith.formData.get('content')).toBe('Updated Content');
    expect(calledWith.formData.get('imageAction')).toBe('keep');
  });

  // 5. handleFormActionの分岐テスト（画像更新時）
  it('新しい画像を選択した状態でフォームを送信すると、FormDataに画像と"update"アクションが含まれること', () => {
    const { result } = renderHook(() =>
      useNoteCard({ note: mockNote, updateNote: mockUpdateNote }),
    );
    const newFile = new File(['new'], 'new.png', { type: 'image/png' });
    const formData = new FormData();

    // --- 事前準備：まず画像を更新した状態を作る ---
    act(() => {
      result.current.onDrop([newFile]);
    });
    // imageActionが'update'になったことを確認
    expect(result.current.imageAction).toBe('update');

    // --- 実行 ---
    act(() => {
      result.current.handleFormAction(formData);
    });

    // --- 検証 ---
    expect(mockUpdateNote).toHaveBeenCalledTimes(1);
    const calledWith = mockUpdateNote.mock.calls[0][0];

    // FormDataに新しいファイルと正しいactionが含まれているか
    expect(calledWith.formData.get('image')).toBe(newFile);
    expect(calledWith.formData.get('imageAction')).toBe('update');
  });

  // 6. handleFormActionの分岐テスト（画像クリア時）
  it('画像をクリアした状態でフォームを送信すると、FormDataに画像が含まれず、"clear"アクションが含まれること', () => {
    const { result } = renderHook(() =>
      useNoteCard({ note: mockNote, updateNote: mockUpdateNote }),
    );
    const formData = new FormData();

    // --- 事前準備：まず画像をクリアした状態を作る ---
    act(() => {
      result.current.handleClearImage();
    });
    // imageActionが'clear'になったことを確認
    expect(result.current.imageAction).toBe('clear');

    // --- 実行 ---
    act(() => {
      result.current.handleFormAction(formData);
    });

    // --- 検証 ---
    expect(mockUpdateNote).toHaveBeenCalledTimes(1);
    const calledWith = mockUpdateNote.mock.calls[0][0];

    // FormDataに画像が含まれず、正しいactionが含まれているか
    expect(calledWith.formData.get('image')).toBe(null);
    expect(calledWith.formData.get('imageAction')).toBe('clear');
  });

  // 7. handleClearImage関数のテスト
  it('handleClearImageを呼び出すと、previewにnull / imageActionにclearがセットされること', () => {
    const { result } = renderHook(() =>
      useNoteCard({ note: mockNote, updateNote: mockUpdateNote }),
    );

    act(() => {
      result.current.setIsEditing(true);
    });

    // previewに値がセットされており、imageActionが'keep'であることを確認
    expect(result.current.preview).toBe(mockNote.imageUrl);
    expect(result.current.imageAction).toBe('keep');

    // handleClearImageの実行
    act(() => {
      result.current.handleClearImage();
    });

    // previewに'null' / imageActionに'clear'がセットされることを確認
    expect(result.current.preview).toBe(null);
    expect(result.current.imageAction).toBe('clear');
  });

  // 8. handleCancel関数のテスト
  it('handleCancelを呼び出すと、isEditingにfalseがセットされること', () => {
    const { result } = renderHook(() =>
      useNoteCard({ note: mockNote, updateNote: mockUpdateNote }),
    );

    act(() => {
      result.current.setIsEditing(true);
    });

    // isEditingが'true'であることを確認
    expect(result.current.isEditing).toBe(true);

    // handleCancelの実行
    act(() => {
      result.current.handleCancel();
    });
    // isEditingに'false'が設定されていることの確認
    expect(result.current.isEditing).toBe(false);
  });
});
