// components/notes/NoteCard.tsx
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
import { Pencil, Trash2 } from 'lucide-react';

import { Note } from '@/types';
import { deleteNoteAction, updateNoteAction } from '@/app/actions';
import { toast } from 'sonner';

type NoteCardProps = {
  note: Note;
};

export const NoteCard = ({ note }: NoteCardProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleUpdate = async (formData: FormData) => {
    const result = await updateNoteAction(note.id, formData);

    if ('error' in result) {
      toast.error(result.error);
    } else {
      toast.success('ノートを更新しました。');
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    // 確認ダイアログなどをここに挟んでも良い
    const result = await deleteNoteAction(note.id);
    if ('error' in result) {
      toast.error(result.error);
    } else {
      toast.success('ノートを削除しました。');
    }
  };

  if (isEditing) {
    return (
      <Card className="flex flex-col h-full">
        <form action={handleUpdate}>
          <CardHeader>
            <Input
              name="title"
              defaultValue={note.title}
              className="text-lg font-bold"
              required
            />
          </CardHeader>
          <CardContent className="flex-grow">
            <Textarea
              name="content"
              defaultValue={note.content}
              className="whitespace-pre-wrap min-h-[100px]"
              required
            />
          </CardContent>
          <CardFooter className="flex justify-end space-x-2 items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              キャンセル
            </Button>
            <Button size="sm" type="submit">
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
        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          編集
        </Button>
        <form action={handleDelete}>
          <Button variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            削除
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};
