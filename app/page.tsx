// app/page.tsx
'use client';

import { NewNoteForm } from '@/components/notes/NewNoteForm';
import { NoteCard } from '@/components/notes/NoteCard';
import { Note, useNotes } from './hooks/useNotes';

const NotePage = () => {
  const {
    notes,
    isLoading,
    isError,
    addNote,
    isAdding,
    updateNote,
    isUpdating,
    deleteNote,
    isDeleting,
  } = useNotes();

  if (isLoading) return <div className="text-center p-10">読み込み中...</div>;
  if (isError)
    return (
      <div className="text-center p-10 text-red-500">
        エラーが発生しました。
      </div>
    );

  return (
    <main className="container mx-auto mt-10 max-w-4xl">
      <h1 className="text-3xl font-bold text-center mb-6">Note App</h1>

      <NewNoteForm addNote={addNote} isAdding={isAdding} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notes?.map((note: Note) => (
          <NoteCard
            key={note.id}
            note={note}
            updateNote={updateNote}
            isUpdating={isUpdating}
            deleteNote={deleteNote}
            isDeleting={isDeleting}
          />
        ))}
      </div>
    </main>
  );
};

export default NotePage;
