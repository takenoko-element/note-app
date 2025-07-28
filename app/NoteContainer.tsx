// app/NoteContainer.tsx
'use client';

import { NewNoteForm } from '@/components/notes/NewNoteForm';
import { Note, useNotes } from './hooks/useNotes';
import { NoteCard } from '@/components/notes/NoteCard';

type NoteContainerProps = {
  initialNotes: Note[];
};

export const NoteContainer = ({ initialNotes }: NoteContainerProps) => {
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
  } = useNotes(initialNotes);

  if (isLoading) return <div className="text-center p-10">読み込み中...</div>;
  if (isError)
    return (
      <div className="text-center p-10 text-red-500">
        エラーが発生しました。
      </div>
    );

  return (
    <>
      <NewNoteForm addNote={addNote} isAdding={isAdding} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notes?.map((note) => (
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
    </>
  );
};
