// app/actions/note.actions.ts
'use server';

import {
  getAllNotes,
  createNote,
  deleteNote,
  updateNote,
} from '@/lib/noteService';

// ノート取得アクション
export const getAllNotesAction = async () => {
  return await getAllNotes('1');
};

// 新規作成アクション
export const createNoteAction = async (formData: FormData) => {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  await createNote('1', { title, content });
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
