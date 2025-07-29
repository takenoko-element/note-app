// app/hooks/useNotes.ts
import { Note } from '@/types';
import { useQuery } from '@tanstack/react-query';

const fetchNotes = async (): Promise<Note[]> => {
  const res = await fetch('api/notes');
  if (!res.ok)
    throw new Error('[useNotes : fetchNote] ノートの取得に失敗しました。');
  return res.json();
};

// カスタムフック本体
export const useNotes = (initialNotes?: Note[]) => {
  const {
    data: notes,
    isLoading,
    isError,
  } = useQuery<Note[]>({
    queryKey: ['notes'],
    queryFn: fetchNotes,
    initialData: initialNotes,
  });

  return {
    notes,
    isLoading,
    isError,
  };
};
