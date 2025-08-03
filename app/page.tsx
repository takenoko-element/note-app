// app/page.tsx
import { NoteContainer } from './NoteContainer';
import { Note } from '@/types';
import { getAllNotesAction } from './actions/note.actions';
import { auth0 } from '@/lib/auth0';

const NotePage = async () => {
  const session = await auth0.getSession();

  if (!session?.user) {
    return (
      <main className="container mx-auto mt-10 max-w-4xl text-center">
        <h1 className="text-3xl font-bold mb-6">Note Appへようこそ</h1>
        <p className="mb-4">ノートの作成・閲覧にはログインしてください。</p>
        <a
          href="/auth/login"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          ログイン
        </a>
      </main>
    );
  }

  const notesFromDb = await getAllNotesAction();
  const initialNotes: Note[] = notesFromDb.map((note) => ({
    ...note,
    createdAt: note.createdAt.toISOString(),
  }));

  return (
    <main className="container mx-auto mt-10 max-w-4xl">
      <NoteContainer initialNotes={initialNotes} />
    </main>
  );
};

export default NotePage;
