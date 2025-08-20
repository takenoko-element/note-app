// app/notes/components/NoteCard.tsx
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { default as NextImage } from 'next/image';

import { Note } from '@/types';
import { useNoteCard } from '../hooks/useNoteCard';
import { NoteEditForm } from './NoteEditForm';

type NoteCardProps = {
  note: Note;
  updateNote: (variables: { id: number; formData: FormData }) => void;
  isUpdating: boolean;
  deleteNote: (id: number) => void;
  isDeleting: boolean;
};

export const NoteCard = ({
  note,
  updateNote,
  isUpdating,
  deleteNote,
  isDeleting,
}: NoteCardProps) => {
  const {
    isEditing,
    preview,
    onDrop,
    handleClearImage,
    handleCancel,
    setIsEditing,
    register,
    handleSubmit,
    onSubmit,
    errors,
  } = useNoteCard({ note, updateNote });

  if (isEditing) {
    return (
      <NoteEditForm
        note={note}
        isUpdating={isUpdating}
        preview={preview}
        onDrop={onDrop}
        handleClearImage={handleClearImage}
        handleCancel={handleCancel}
        register={register}
        handleSubmit={handleSubmit}
        onSubmit={onSubmit}
        errors={errors}
      />
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <Link href={`/notes/${note.id}`} className="hover:underline min-w-0">
          <CardTitle className="truncate">{note.title}</CardTitle>
        </Link>
        <CardDescription>
          {new Date(note.createdAt).toLocaleString('ja-JP')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="whitespace-pre-wrap">{note.content}</p>
      </CardContent>
      {note.imageUrl && (
        <div className="relative w-full h-40 px-6 pt-2">
          <div className="relative w-full h-full rounded-md border bg-slate-50 p-1">
            <NextImage
              src={note.imageUrl}
              alt={note.title}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        </div>
      )}
      <CardFooter className="flex justify-end space-x-2 items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(true)}
          disabled={isDeleting}
        >
          <Pencil className="mr-2 h-4 w-4" />
          編集
        </Button>
        <form action={() => deleteNote(note.id)}>
          <Button
            variant="destructive"
            size="sm"
            type="submit"
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Trash2 className="mr-2 h-4 w-4" />
            削除
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};
