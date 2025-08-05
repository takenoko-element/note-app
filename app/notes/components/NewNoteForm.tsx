// app/components/notes/NewNoteForm.tsx
'use client';

import { useRef } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Button } from '@/app/components/ui/button';
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
          <div>
            <label htmlFor="image" className="text-sm font-medium">
              画像
            </label>
            <Input
              id="image"
              name="image"
              type="file"
              accept="image/*"
              disabled={isAdding}
              className="mt-1"
            />
          </div>
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
