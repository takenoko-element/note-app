// components/notes/NoteCard.tsx
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
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

import { Note } from '@/app/hooks/useNotes';

type NoteCardProps = {
  note: Note;
  updateNote: (updatedNote: {
    id: number;
    title: string;
    content: string;
  }) => void;
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
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);

  const handleSaveClick = () => {
    if (!title.trim() || !content.trim()) {
      toast.error('タイトルと内容の入力は必須です。');
      return;
    }
    updateNote({ id: note.id, title, content });
    setIsEditing(false);
  };

  const handleCancelClick = () => {
    setTitle(note.title);
    setContent(note.content);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isUpdating}
            className="text-lg font-bold"
          />
        </CardHeader>
        <CardContent>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isUpdating}
            className="whitespace-pre-wrap min-h-[100px]"
          />
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button variant="ghost" size="sm" onClick={handleCancelClick}>
            キャンセル
          </Button>
          <Button size="sm" onClick={handleSaveClick} disabled={isUpdating}>
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            保存
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{note.title}</CardTitle>
        <CardDescription>
          {new Date(note.createdAt).toLocaleString('ja-JP')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap">{note.content}</p>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          編集
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => deleteNote(note.id)}
          disabled={isDeleting}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          削除
        </Button>
      </CardFooter>
    </Card>
  );
};
