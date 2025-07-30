// app/api/notes/route.ts
import { NextResponse } from 'next/server';
import { getAllNotes } from '@/lib/noteService';

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
