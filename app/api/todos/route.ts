import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { User } from '@/types/user';
import { createTodo } from '@/lib/todoService';

const userId = '1';

export const GET = async () => {
  try {
    const todos = await prisma.todo.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(todos);
  } catch (error) {
    console.error('[GET] API Request Failed:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました。' },
      { status: 500 },
    );
  }
};

export const POST = async (req: Request) => {
  const dummyUser: User = {
    userId,
    email: 'test@example.com',
    name: 'Test User',
  };

  try {
    const body: { text: string } = await req.json();

    const newTodo = await createTodo(body.text, dummyUser);

    return NextResponse.json(newTodo, { status: 201 });
  } catch (error) {
    console.error('[POTST] API Create Fail', error);

    // text が空だった場合に、todoServiceからスルーされるエラー処理
    if (error instanceof Error && error.message.includes('必須です')) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました。' },
      { status: 500 },
    );
  }
};
