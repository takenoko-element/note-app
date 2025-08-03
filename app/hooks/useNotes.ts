// app/hooks/useNotes.ts
'use client';

import { Note } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createNoteAction,
  deleteNoteAction,
  getAllNotesAction,
  updateNoteAction,
} from '../actions/note.actions';
import { toast } from 'sonner';

export const useNotes = (initialNotes?: Note[]) => {
  const queryClient = useQueryClient();

  // ノート取得処理
  const {
    data: notes,
    isLoading,
    isError,
  } = useQuery<Note[]>({
    queryKey: ['notes'],
    queryFn: async () => {
      const notesFromDb = await getAllNotesAction();
      return notesFromDb.map((note) => ({
        ...note,
        createdAt: new Date(note.createdAt).toISOString(),
      }));
    },
    initialData: initialNotes,
    staleTime: 60 * 1000, // ページマウント直後の不要な再フェッチを防ぐ(1分)
  });

  // ノート作成処理
  const addNoteMutation = useMutation({
    mutationFn: createNoteAction,
    onSuccess: () => {
      toast.success('ノートを作成しました。');
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
    onError: (err) => toast.error(err.message),
  });

  // ノート更新処理（プリミティブアップデート）
  const updateNoteMutation = useMutation({
    mutationFn: (variables: { id: number; formData: FormData }) =>
      updateNoteAction(variables.id, variables.formData),
    onMutate: async (updatedNote) => {
      // ノート取得処理が走っている可能性があるため、進行中のクエリをキャンセルする
      await queryClient.cancelQueries({ queryKey: ['notes'] });
      // 以前のノートリストをスナップショット
      const previousNotes = queryClient.getQueryData<Note[]>(['notes']);
      // UIを楽観的に更新
      queryClient.setQueryData<Note[]>(['notes'], (old: Note[] | undefined) =>
        old?.map((note) =>
          note.id === updatedNote.id
            ? {
                ...note,
                title: updatedNote.formData.get('title') as string,
                content: updatedNote.formData.get('content') as string,
              }
            : note,
        ),
      );
      // エラー時にロールバックするためのコンテキストを返す
      return { previousNotes };
    },
    onError: (err, variables, context) => {
      toast.error(err.message);
      // エラーが発生したら、スナップショットからUIを元に戻す
      if (context?.previousNotes) {
        queryClient.setQueryData(['notes'], context.previousNotes);
      }
    },
    // 成功・失敗に関わらず、最終的にサーバーと同期する
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  // ノート削除処理
  const deleteNoteMutation = useMutation({
    mutationFn: deleteNoteAction,
    onSuccess: () => {
      toast.success('ノートを削除しました。');
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
    onError: (err) => toast.error(err.message),
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
