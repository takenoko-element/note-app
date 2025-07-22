// app/lib/noteService.ts
import prisma from '@/lib/prisma';

// ノートを全件取得
export const getAllNotes = async (userId: string) => {
  return await prisma.note.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
};

// ノートを新規作成
export const createNote = async (
  userId: string,
  data: { title: string; content: string },
) => {
  if (!data.title.trim()) {
    throw new Error('タイトルの入力は必須です。');
  }
  if (!data.content.trim()) {
    throw new Error('コンテンツの入力は必須です。');
  }
  return await prisma.note.create({
    data: {
      title: data.title,
      content: data.content,
      userId: userId,
    },
  });
};

// ノートを編集
export const updateNote = async (
  id: bigint,
  userId: string,
  data: { title: string; content: string },
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
    },
  });
};

// ノートを削除
export const deleteNote = async (id: bigint, userId: string) => {
  // ユーザーの確認処理
  const note = await prisma.note.findUnique({ where: { id } });
  if (!note || note.userId !== userId) {
    throw new Error('削除権限のないノートです。');
  }

  return await prisma.note.delete({
    where: { id },
  });
};
