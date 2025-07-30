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
} from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Loader2, Pencil, Trash2 } from 'lucide-react';

import { Note } from '@/types';

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
          className="flex flex-col flex-grow"
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
        <CardTitle>{note.title}</CardTitle>
        <CardDescription>
          {new Date(note.createdAt).toLocaleString('ja-JP')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="whitespace-pre-wrap">{note.content}</p>
      </CardContent>
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
