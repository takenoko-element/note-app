// app/actions.ts
'use server';

import { createNote, deleteNote, updateNote } from '@/lib/noteService';
import { ActionResult } from '@/types';

// 新規作成アクション
export const createNoteAction = async (formData: FormData) => {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  await createNote('1', { title, content }); // サーバーサイドのDBサービスを直接呼び出し
};

// 更新アクション
export const updateNoteAction = async (id: number, formData: FormData) => {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  await updateNote(id, '1', { title, content });
};

// 削除アクション
export const deleteNoteAction = async (id: number) => {
  await deleteNote(id, '1');
};
