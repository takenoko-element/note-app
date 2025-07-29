// app/NoteContainer.tsx
'use client';

import { Note } from '@/types';
import { NewNoteForm } from '@/components/notes/NewNoteForm';
import { NoteCard } from '@/components/notes/NoteCard';

type NoteContainerProps = {
  initialNotes: Note[];
};

export const NoteContainer = ({ initialNotes }: NoteContainerProps) => {
  return (
    <>
      <NewNoteForm />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialNotes.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>
    </>
  );
};
