// app/lib/noteService.ts
import prisma from '@/lib/prisma';
import { auth0 } from './auth0';
import { findOrCreateUser } from './userService';
import { getSignedUrl } from './image.service';

// ノートを全件取得
export const getAllNotes = async (userId: string) => {
  const notes = await prisma.note.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  // 取得した各ノートの画像パスから署名付きURLを生成
  const notesWithSignedUrls = await Promise.all(
    notes.map(async (note) => {
      if (note.imageUrl) {
        // imageUrl（ファイルパス）を署名付きURLで上書き
        note.imageUrl = await getSignedUrl(note.imageUrl);
      }
      return note;
    }),
  );

  return notesWithSignedUrls;
};

// ノートを1件取得
export const getNoteById = async (id: number, userId: string) => {
  const note = await prisma.note.findUnique({
    where: {
      id: id,
      userId: userId,
    },
  });

  if (!note) {
    return null;
  }
  // 画像パスがあれば署名付きURLを生成して上書き
  if (note.imageUrl) {
    note.imageUrl = await getSignedUrl(note.imageUrl);
  }

  return note;
};

// ノートを新規作成
export const createNote = async (
  userId: string,
  data: { title: string; content: string; imageUrl?: string },
) => {
  if (!data.title.trim()) {
    throw new Error('タイトルの入力は必須です。');
  }
  if (!data.content.trim()) {
    throw new Error('コンテンツの入力は必須です。');
  }

  const session = await auth0.getSession();
  const user = session?.user;
  if (user && user.sub && user.email) {
    await findOrCreateUser({
      id: user.sub,
      email: user.email,
      name: user.name,
    });
  }

  return await prisma.note.create({
    data: {
      title: data.title,
      content: data.content,
      imageUrl: data.imageUrl,
      userId: userId,
    },
  });
};

// ノートを編集
export const updateNote = async (
  id: number,
  userId: string,
  data: { title: string; content: string; imageUrl?: string | null },
) => {
  if (!data.title.trim()) {
    throw new Error('タイトルの入力は必須です。');
  }
  if (!data.content.trim()) {
    throw new Error('コンテンツの入力は必須です。');
  }

  // ユーザーの確認処理
  const note = await prisma.note.findUnique({ where: { id } });
  if (!note || note.userId !== userId) {
    throw new Error('更新権限のないノートです。');
  }

  return await prisma.note.update({
    where: { id },
    data: {
      title: data.title,
      content: data.content,
      imageUrl: data.imageUrl,
    },
  });
};

// ノートを削除
export const deleteNote = async (id: number, userId: string) => {
  // ユーザーの確認処理
  const note = await prisma.note.findUnique({ where: { id } });
  if (!note || note.userId !== userId) {
    console.error('userID:', note?.userId);
    throw new Error('削除権限のないノートです。');
  }

  return await prisma.note.delete({
    where: { id },
  });
};
