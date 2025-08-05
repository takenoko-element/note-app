// app/components/notes/NoteCard.tsx
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Button } from '@/app/components/ui/button';
import { Loader2, Pencil, Trash2 } from 'lucide-react';

import { Note } from '@/types';
import Link from 'next/link';
import { default as NextImage } from 'next/image';

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
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <Card className="flex flex-col h-full">
        <form
          action={(formData) => {
            updateNote({ id: note.id, formData });
            setIsEditing(false); // オプティミスティックアップデートがUIを即時更新するため、ここで呼んでも良い
          }}
          className="flex flex-col flex-grow gap-4"
        >
          <CardHeader>
            <Input
              name="title"
              defaultValue={note.title}
              className="text-lg font-bold"
              disabled={isUpdating}
              required
            />
          </CardHeader>
          <CardContent className="flex-grow">
            <Textarea
              name="content"
              defaultValue={note.content}
              className="whitespace-pre-wrap min-h-[100px]"
              disabled={isUpdating}
              required
            />
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              キャンセル
            </Button>
            <Button type="submit" size="sm" disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存
            </Button>
          </CardFooter>
        </form>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <Link href={`/notes/${note.id}`} className="hover:underline">
          <CardTitle>{note.title}</CardTitle>
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
