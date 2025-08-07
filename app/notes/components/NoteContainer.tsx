// app/notes/components/NoteContainer.tsx
'use client';

import { Note } from '@/types';
import { NewNoteForm } from './NewNoteForm';
import { NoteCard } from './NoteCard';
import { useNotes } from '../hooks/useNotes';
import { NoteCardSkeleton } from './NoteCardSkeleton';

type NoteContainerProps = {
  initialNotes: Note[];
};

export const NoteContainer = ({ initialNotes }: NoteContainerProps) => {
  const {
    notes,
    isFetching,
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
        {isFetching
          ? Array.from({ length: 3 }).map((_, i) => (
              <NoteCardSkeleton key={i} />
            ))
          : notes?.map((note) => (
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
