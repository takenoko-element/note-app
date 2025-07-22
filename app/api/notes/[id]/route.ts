// app/api/notes/[id]/route.ts
import { NextResponse } from 'next/server';

import { updateNote, deleteNote } from '@/lib/noteService';

interface Params {
  params: {
    id: string;
  };
}

export const PUT = async (req: Request, { params }: Params) => {
  try {
    const dummyUserId = '1';
    const { id } = params;
    const body: { title: string; content: string } = await req.json();
    const updateTodo = await updateNote(BigInt(id), dummyUserId, body);
    return NextResponse.json(updateTodo, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      // title/content が空だった場合に、noteServiceからスルーされるエラー処理
      if (error instanceof Error && error.message.includes('必須です')) {
        return NextResponse.json({ message: error.message }, { status: 400 });
      }
      // userIdが不正だった場合に、noteServiceからスルーされるエラー処理
      if (error.message.includes('権限のないノートです')) {
        return NextResponse.json({ message: error.message }, { status: 403 });
      }
      // prismaの標準エラー
      if (error.message.includes('Record to update not found')) {
        return NextResponse.json(
          { message: '指定されたタスクが見つかりません。' },
          { status: 404 },
        );
      }
    }
    console.error('[PUT api/notes] APIリクエストに失敗しました。:', error);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました。' },
      { status: 500 },
    );
  }
};

export const DELETE = async (req: Request, { params }: Params) => {
  try {
    const dummyUserId = '1';
    const { id } = params;
    await deleteNote(BigInt(id), dummyUserId);
    return NextResponse.json(null, { status: 204 });
  } catch (error) {
    console.error('[DELETE api/notes] APIリクエストに失敗しました。:', error);
    if (error instanceof Error) {
      // userIdが不正だった場合に、noteServiceからスルーされるエラー処理
      if (error.message.includes('権限のないノートです')) {
        return NextResponse.json({ message: error.message }, { status: 403 });
      }
      // prismaの標準エラー
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
