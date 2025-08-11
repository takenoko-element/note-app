// mocks/handlers.ts
import { http, HttpResponse } from 'msw';

// ノート一覧のモックデータ
const mockNotes = [
  {
    id: 1,
    title: 'MSWのテスト',
    content: '最初のノートです',
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'React Queryのテスト',
    content: '2番目のノートです',
    createdAt: new Date().toISOString(),
  },
];

export const handlers = [
  // ルートパス("/")へのPOSTリクエストをすべてこのハンドラで受け取る
  http.post('http://localhost:3000/', async ({ request }) => {
    // リクエストURLからクエリパラメータを取得
    const url = new URL(request.url);
    const action = url.searchParams.get('_action');

    // actionの値によって処理を分岐
    if (action === 'getAllNotesAction') {
      console.log('MSW: Handled getAllNotesAction');
      return HttpResponse.json(mockNotes);
    }

    if (action === 'deleteNoteAction') {
      console.log('MSW: Handled deleteNoteAction');
      // Server Actionsは引数をFormDataで渡すため、それを読み取る
      const formData = await request.formData();
      const noteId = formData.get('id'); // 'id'はaction呼び出し時の引数名に依存
      console.log(`MSW: Deleting note with id: ${noteId}`);

      // 成功レスポンスを返す
      return HttpResponse.json({ success: true });
    }

    // どのactionにも一致しない場合は、エラーレスポンスを返す
    return new HttpResponse('Action not handled', { status: 404 });
  }),
];
