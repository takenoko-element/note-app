// app/actions/note.actions.ts
'use server';

import {
  getAllNotes,
  createNote,
  deleteNote,
  updateNote,
} from '@/lib/noteService';
import { auth0 } from '@/lib/auth0';

// ユーザーID取得用のヘルパー関数
const getUserId = async () => {
  const session = await auth0.getSession();
  const userId = session?.user?.sub; // 'sub'がAuth0のユーザーID

  if (!userId) {
    throw new Error('ユーザーが認証されていません。ログインしてください。');
  }
  return userId;
};

// ノート取得アクション
export const getAllNotesAction = async () => {
  const userId = await getUserId();
  return await getAllNotes(userId);
};

// 新規作成アクション
export const createNoteAction = async (formData: FormData) => {
  const userId = await getUserId();
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  await createNote(userId, { title, content });
};

// 更新アクション
export const updateNoteAction = async (id: number, formData: FormData) => {
  const userId = await getUserId();
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  await updateNote(id, userId, { title, content });
};

// 削除アクション
export const deleteNoteAction = async (id: number) => {
  const userId = await getUserId();
  await deleteNote(id, userId);
};
