// app/actions.ts
'use server';

import { createNote, deleteNote, updateNote } from '@/lib/noteService';
import { ActionResult } from '@/types';
import { revalidatePath } from 'next/cache';

// 新規作成アクション
export const createNoteAction = async (
  formData: FormData,
): Promise<ActionResult> => {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  try {
    await createNote('1', { title, content }); // サーバーサイドのDBサービスを直接呼び出し
    revalidatePath('/'); // データ更新後、関連するページのキャッシュを更新する
    return { success: true };
  } catch (err) {
    if (err instanceof Error) {
      return { error: err.message };
    } else {
      return { error: '予期せぬエラーが発生しました。' };
    }
  }
};

// 更新アクション
export const updateNoteAction = async (
  id: number,
  formData: FormData,
): Promise<ActionResult> => {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  try {
    await updateNote(id, '1', { title, content });
    revalidatePath('/');
    return { success: true };
  } catch (err) {
    if (err instanceof Error) {
      return { error: err.message };
    } else {
      return { error: '予期せぬエラーが発生しました。' };
    }
  }
};

// 削除アクション
export const deleteNoteAction = async (id: number): Promise<ActionResult> => {
  try {
    await deleteNote(id, '1');
    revalidatePath('/');
    return { success: true };
  } catch (err) {
    if (err instanceof Error) {
      return { error: err.message };
    } else {
      return { error: '予期せぬエラーが発生しました。' };
    }
  }
};
