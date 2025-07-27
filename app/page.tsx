// app/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

import { Trash2, Pencil, PenOff, Loader2 } from 'lucide-react';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type Note = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
};

const fetchNotes = async (): Promise<Note[]> => {
  const res = await fetch('api/notes');
  if (!res.ok) throw new Error('Fail to fetch Notes');
  return res.json();
};

const addNote = async (newNote: { title: string; content: string }) => {
  await fetch('api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newNote),
  });
};

const updateNote = async (updateNote: {
  id: number;
  title: string;
  content: string;
}) => {
  const { id, title, content } = updateNote;
  const res = await fetch(`api/notes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content }),
  });
  if (!res.ok) throw new Error('ノートの編集に失敗しました。');
};

const deleteNote = async (noteId: number) => {
  await fetch(`api/notes/${noteId}`, {
    method: 'DELETE',
  });
};

const NotePage = () => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingContent, setEditingContent] = useState('');

  const {
    data: notes,
    isLoading,
    isError,
  } = useQuery<Note[]>({
    queryKey: ['notes'],
    queryFn: fetchNotes,
  });

  const addNoteMutation = useMutation({
    mutationFn: addNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('ノートの作成に成功しました。');
    },
    onError: (error) => {
      console.error(error);
      toast.error('ノートの作成に失敗しました。');
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: updateNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setEditingNoteId(null);
      toast.success('ノートを更新しました。');
    },
    onError: (error) => {
      console.error(error);
      toast.error('ノートの更新に失敗しました。');
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('ノートを削除しました。');
    },
    onError: (error) => {
      console.error(error);
      toast.error('ノートの削除に失敗しました。');
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      toast.error('タイトルの入力は必須です。');
      return;
    }
    if (!content.trim()) {
      toast.error('コンテンツの入力は必須です。');
      return;
    }
    addNoteMutation.mutate({ title, content });
    setTitle('');
    setContent('');
  };

  const handleEditClick = (note: Note) => {
    setEditingNoteId(note.id);
    setEditingTitle(note.title);
    setEditingContent(note.content);
  };

  const handleCancelClick = () => {
    setEditingNoteId(null);
  };

  const handleSaveClick = (noteId: number) => {
    if (!editingTitle.trim()) {
      toast.error('タイトルの入力は必須です。');
      return;
    }
    if (!editingContent.trim()) {
      toast.error('コンテンツの入力は必須です。');
      return;
    }
    updateNoteMutation.mutate({
      id: noteId,
      title: editingTitle,
      content: editingContent,
    });
  };

  if (isLoading) return <div className="text-center p-10">読み込み中...</div>;
  if (isError)
    return (
      <div className="text-center p-10 text-red-500">
        エラーが発生しました。
      </div>
    );

  return (
    <main className="container mx-auto mt-10 max-w-4xl">
      <h1 className="text-3xl font-bold text-center mb-6">Todo App</h1>

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
              disabled={addNoteMutation.isPending}
            />
            <Textarea
              placeholder="内容"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={addNoteMutation.isPending}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={addNoteMutation.isPending}>
              {addNoteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              作成
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notes?.map((note) => (
          <Card key={note.id.toString()}>
            {editingNoteId === note.id ? (
              // ----- 編集モード -----
              <>
                <CardHeader>
                  <Input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    disabled={updateNoteMutation.isPending}
                    className="text-lg font-bold"
                  />
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    disabled={updateNoteMutation.isPending}
                    className="whitespace-pre-wrap min-h-[100px]"
                  />
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  <Button variant="ghost" size="sm" onClick={handleCancelClick}>
                    キャンセル
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSaveClick(note.id)}
                    disabled={updateNoteMutation.isPending}
                  >
                    {updateNoteMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    保存
                  </Button>
                </CardFooter>
              </>
            ) : (
              <>
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(note)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    編集
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteNoteMutation.mutate(note.id)}
                    disabled={deleteNoteMutation.isPending}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    削除
                  </Button>
                </CardFooter>
              </>
            )}
          </Card>
        ))}
      </div>
    </main>
  );
};

export default NotePage;
