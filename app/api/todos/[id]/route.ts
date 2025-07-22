import { NextResponse } from 'next/server';

import { deleteTodo, updateTodoStatus } from '@/lib/todoService';

interface Params {
  params: {
    id: string;
  };
}

export const PUT = async (req: Request, { params }: Params) => {
  try {
    const { id } = params;
    const body = await req.json();
    const updateTodo = await updateTodoStatus(id, body);
    return NextResponse.json(updateTodo);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Record to update not found')) {
        return NextResponse.json(
          { message: '指定されたタスクが見つかりません。' },
          { status: 404 },
        );
      }
    }
    console.error('[PUT] API Request Failed:', error);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました。' },
      { status: 500 },
    );
  }
};

export const DELETE = async (req: Request, { params }: Params) => {
  try {
    const { id } = params;
    await deleteTodo(id);
    return NextResponse.json({ message: 'タスクが正常に削除されました。' });
  } catch (error) {
    console.error('[DELETE] API Request Failed:', error);
    if (error instanceof Error) {
      if (error.message.includes('Record to delete not found')) {
        return NextResponse.json(
          { message: '指定されたタスクが見つかりません。' },
          { status: 404 },
        );
      }
    }
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました。' },
      { status: 500 },
    );
  }
};
