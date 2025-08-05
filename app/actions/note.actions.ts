// app/actions/note.actions.ts
'use server';

import fs from 'node:fs/promises';
import path from 'node:path';
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

// 画像保存用のヘルパー関数
const saveImageAndGetUrl = async (
  file: File | null,
): Promise<string | undefined> => {
  if (!file || file.size === 0) {
    return undefined;
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  // 保存先のディレクトリパスを生成
  const uploadDir = path.join(process.cwd(), 'public/uploads');

  // ディレクトリが存在しない場合は再帰的に作成
  await fs.mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, `${Date.now()}_${file.name}`);
  await fs.writeFile(filePath, buffer);

  // publicディレクトリからの相対パスを返す
  return `/uploads/${path.basename(filePath)}`;
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

  const imageUrl = await saveImageAndGetUrl(file);

  await createNote(userId, { title, content, imageUrl });
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
    updateData.imageUrl = await saveImageAndGetUrl(file);
  }

  await updateNote(id, userId, updateData);
};

// 削除アクション
export const deleteNoteAction = async (id: number) => {
  const userId = await getUserId();
  await deleteNote(id, userId);
};
