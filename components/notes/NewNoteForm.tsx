// components/notes/NewNoteForm.tsx
'use client';

import { useRef } from 'react';
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

import { createNoteAction } from '@/app/actions';
import { toast } from 'sonner';

export const NewNoteForm = () => {
  const formRef = useRef<HTMLFormElement>(null);

  const handleCreate = async (formData: FormData) => {
    const result = await createNoteAction(formData);

    if ('error' in result) {
      toast.error(result.error);
    } else {
      toast.success('ノートを新しく作成しました。');
      formRef.current?.reset();
    }
  };

  return (
    <Card className="mb-10">
      <CardHeader>
        <CardTitle>新しいノートの作成</CardTitle>
      </CardHeader>
      <form ref={formRef} action={handleCreate}>
        <CardContent className="space-y-4">
          <Input name="title" placeholder="タイトル" required />
          <Textarea name="content" placeholder="内容" required />
        </CardContent>
        <CardFooter>
          <Button type="submit">作成</Button>
        </CardFooter>
      </form>
    </Card>
  );
};
