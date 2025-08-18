// app/actions/note.actions.ts
'use server';

import { revalidatePath } from 'next/cache';

import {
  getAllNotes,
  createNote,
  deleteNote,
  updateNote,
} from '@/lib/noteService';
import { auth0 } from '@/lib/auth0';
import { saveImageAndGetPath } from '@/lib/image.service';

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
  const file = formData.get('image') as File | null;

  const imageUrl = await saveImageAndGetPath(file);

  await createNote(userId, { title, content, imageUrl });
  revalidatePath('/');
};

// 更新アクション
export const updateNoteAction = async (id: number, formData: FormData) => {
  const userId = await getUserId();
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const file = formData.get('image') as File | null;

  const imageAction = formData.get('imageAction') as
    | 'keep'
    | 'clear'
    | 'update';

  const updateData: {
    title: string;
    content: string;
    imageUrl?: string | null;
  } = {
    title,
    content,
  };
  if (imageAction === 'clear') {
    updateData.imageUrl = null;
  } else if (imageAction === 'update' && file && file.size > 0) {
    updateData.imageUrl = await saveImageAndGetPath(file);
  }

  await updateNote(id, userId, updateData);
  revalidatePath('/');
};

// 削除アクション
export const deleteNoteAction = async (id: number) => {
  const userId = await getUserId();
  await deleteNote(id, userId);
  revalidatePath('/');
};
