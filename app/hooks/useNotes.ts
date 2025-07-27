// app/hooks/useNotes.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export type Note = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
};

const fetchNotes = async (): Promise<Note[]> => {
  const res = await fetch('api/notes');
  if (!res.ok)
    throw new Error('[useNotes : fetchNote] ノートの取得に失敗しました。');
  return res.json();
};

const addNote = async (newNote: { title: string; content: string }) => {
  const res = await fetch('api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newNote),
  });
  if (!res.ok)
    throw new Error('[useNotes : addNote] ノートの作成に失敗しました。');
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
  if (!res.ok)
    throw new Error('[useNotes : updateNote] ノートの編集に失敗しました。');
};

const deleteNote = async (noteId: number) => {
  const res = await fetch(`api/notes/${noteId}`, {
    method: 'DELETE',
  });
  if (!res.ok)
    throw new Error('[useNotes : deleteNote] ノートの削除に失敗しました。');
};

// カスタムフック本体
export const useNotes = () => {
  const queryClient = useQueryClient();

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

  return {
    notes,
    isLoading,
    isError,
    addNote: addNoteMutation.mutate,
    isAdding: addNoteMutation.isPending,
    updateNote: updateNoteMutation.mutate,
    isUpdating: updateNoteMutation.isPending,
    deleteNote: deleteNoteMutation.mutate,
    isDeleting: deleteNoteMutation.isPending,
  };
};
