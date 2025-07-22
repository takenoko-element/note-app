'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
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

type Task = {
  id: string;
  text: string;
  completed: boolean;
};

type Note = {
  id: bigint;
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

const deleteNote = async (noteId: bigint) => {
  await fetch(`api/notes/${noteId}`, {
    method: 'DELETE',
  });
};

const TodoPage = () => {
  // const [tasks, setTasks] = useState<Task[]>([]);
  // const [newTaskText, setNewTaskText] = useState('');
  // const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  // const [editTaskText, setEditTaskText] = useState('');

  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

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
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !content.trim()) return;
    addNoteMutation.mutate({ title, content });
    setTitle('');
    setContent('');
  };
  // const handleAddTask = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!newTaskText.trim()) return;

  //   const newTask: Task = {
  //     id: crypto.randomUUID(),
  //     text: newTaskText,
  //     completed: false,
  //   };

  //   setTasks([...tasks, newTask]);
  //   setNewTaskText('');
  // };

  // const handleToggleTask = (id: string) => {
  //   setTasks(
  //     tasks.map((task) => {
  //       return task.id === id ? { ...task, completed: !task.completed } : task;
  //     }),
  //   );
  // };

  // const handleStartEdit = (task: Task) => {
  //   setEditingTaskId(task.id);
  //   setEditTaskText(task.text);
  // };

  // const handleSaveEdit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (editTaskText.trim()) {
  //     setTasks(
  //       tasks.map((task) => {
  //         return task.id === editingTaskId
  //           ? { ...task, text: editTaskText }
  //           : task;
  //       }),
  //     );
  //   }
  //   setEditingTaskId(null);
  //   setEditTaskText('');
  // };

  // const handleDeleteTask = (id: string) => {
  //   setTasks(tasks.filter((task) => task.id !== id));
  // };

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
            <CardHeader>
              <CardTitle>{note.title}</CardTitle>
              <CardDescription>
                {new Date(note.createdAt).toLocaleString('ja-JP')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{note.content}</p>
            </CardContent>
            <CardFooter>
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
          </Card>
        ))}
      </div>
      {/* Todo追加フォーム */}
      {/* <form onSubmit={handleAddTask} className="flex gap-2 mb-6">
        <Input
          type="text"
          placeholder="新しいタスクを入力..."
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
        />
        <Button type="submit">追加</Button>
      </form> */}

      {/* Todoリスト */}
      {/* <div className="space-y-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center p-4 border rounded-lg"
          >
            <Checkbox
              id={task.id}
              checked={task.completed}
              onCheckedChange={() => handleToggleTask(task.id)}
            />
            {task.id === editingTaskId ? (
              <form
                onSubmit={handleSaveEdit}
                className="flex flex-grow gap-2 items-center"
              >
                <Input
                  type="text"
                  value={editTaskText}
                  onChange={(e) => setEditTaskText(e.target.value)}
                  autoFocus
                />
                <Button type="submit" variant="ghost" size="icon">
                  <PenOff className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <>
                <label
                  htmlFor={task.id}
                  className={`ml-3 text-lg flex-grow ${
                    task.completed ? 'line-through text-muted-foreground' : ''
                  }`}
                >
                  {task.text}
                </label>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleStartEdit(task)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteTask(task.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div> */}
    </main>
  );
};

export default TodoPage;
