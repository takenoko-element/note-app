// app/page.tsx
import { NoteContainer } from './NoteContainer';
import { Note } from '@/types';
import { getAllNotesAction } from './actions/note.actions';

const NotePage = async () => {
  const notesFromDb = await getAllNotesAction();
  const initialNotes: Note[] = notesFromDb.map((note) => ({
    ...note,
    createdAt: note.createdAt.toISOString(),
  }));

  return (
    <main className="container mx-auto mt-10 max-w-4xl">
      <h1 className="text-3xl font-bold text-center mb-6">Note App</h1>
      <NoteContainer initialNotes={initialNotes} />
    </main>
  );
};

export default NotePage;
