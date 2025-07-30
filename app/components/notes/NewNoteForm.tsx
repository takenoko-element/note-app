// app/components/notes/NewNoteForm.tsx
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
import { Loader2 } from 'lucide-react';

type NewNoteFormProps = {
  addNote: (formData: FormData) => void;
  isAdding: boolean;
};

export const NewNoteForm = ({ addNote, isAdding }: NewNoteFormProps) => {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Card className="mb-10">
      <CardHeader>
        <CardTitle>新しいノートの作成</CardTitle>
      </CardHeader>
      <form
        ref={formRef}
        action={(formData) => {
          addNote(formData);
          formRef.current?.reset();
        }}
        className="space-y-4"
      >
        <CardContent className="space-y-4">
          <Input
            name="title"
            placeholder="タイトル"
            disabled={isAdding}
            required
          />
          <Textarea
            name="content"
            placeholder="内容"
            disabled={isAdding}
            required
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
