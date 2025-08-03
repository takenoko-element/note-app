// lib/userService.ts
import prisma from '@/lib/prisma';

type UserData = {
  id: string; // Auth0 sub
  email: string;
  name?: string | null;
};

/**
 * ユーザーID（Auth0のsub）を元にユーザーを検索し、
 * 存在しない場合は新しいユーザーを作成する
 * @param data - Auth0から受け取ったユーザー情報
 * @returns データベース上のユーザー
 */
export const findOrCreateUser = async (data: UserData) => {
  if (!data.id || !data.email) {
    throw new Error('ユーザー情報が不完全です。');
  }

  const user = await prisma.user.findUnique({
    where: { id: data.id },
  });

  if (user) {
    return user;
  }

  const newUser = await prisma.user.create({
    data: {
      id: data.id,
      email: data.email,
      name: data.name,
    },
  });

  return newUser;
};
