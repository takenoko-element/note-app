// app/NoteContainer.tsx
'use client';

import { Note } from '@/types';
import { NewNoteForm } from '@/app/components/notes/NewNoteForm';
import { NoteCard } from '@/app/components/notes/NoteCard';
import { useNotes } from './hooks/useNotes';

type NoteContainerProps = {
  initialNotes: Note[];
};

export const NoteContainer = ({ initialNotes }: NoteContainerProps) => {
  const {
    notes,
    addNote,
    isAdding,
    updateNote,
    isUpdating,
    deleteNote,
    isDeleting,
  } = useNotes(initialNotes);

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
