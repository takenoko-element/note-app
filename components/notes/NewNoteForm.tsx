// components/notes/NewNoteForm.tsx
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Loader2 } from 'lucide-react';

type NewNoteFormProps = {
  addNote: (note: { title: string; content: string }) => void;
  isAdding: boolean;
};

export const NewNoteForm = ({ addNote, isAdding }: NewNoteFormProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      toast.error('タイトルの入力は必須です。');
      return;
    }
    if (!content.trim()) {
      toast.error('内容の入力は必須です。');
      return;
    }
    addNote({ title, content });
    setTitle('');
    setContent('');
  };

  return (
    <Card className="mb-10">
      <CardHeader>
        <CardTitle>新しいノートの作成</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <Input
            placeholder="タイトル"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isAdding}
          />
          <Textarea
            placeholder="内容"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isAdding}
          />
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isAdding}>
            {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            作成
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
