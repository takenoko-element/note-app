// app/api/notes/route.ts
import { NextResponse } from 'next/server';
import { getAllNotes, createNote } from '@/lib/noteService';

export const GET = async () => {
  try {
    const dummyUserId = '1';
    const notes = await getAllNotes(dummyUserId);
    return NextResponse.json(notes, { status: 200 });
  } catch (error) {
    console.error('[GET /api/notes] notesの取得に失敗しました:', error);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました。' },
      { status: 500 },
    );
  }
};

export const POST = async (req: Request) => {
  const dummyUserId = '1';

  try {
    const body: { title: string; content: string } = await req.json();

    const newNote = await createNote(dummyUserId, body);

    return NextResponse.json(newNote, { status: 201 });
  } catch (error) {
    console.error('[POST /api/notes] noteの作成に失敗しました:', error);

    // title/content が空だった場合に、noteServiceからスルーされるエラー処理
    if (error instanceof Error && error.message.includes('必須です')) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました。' },
      { status: 500 },
    );
  }
};
