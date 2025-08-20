// app/notes/hooks/useNoteCard.ts
'use client';

import { Note } from '@/types';
import { useState, useEffect, useCallback } from 'react';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { noteSchema, NoteFormInput } from '@/lib/validators';

type UseNoteCardProps = {
  note: Note;
  updateNote: (variables: { id: number; formData: FormData }) => void;
};

export const useNoteCard = ({ note, updateNote }: UseNoteCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  // 画像編集用の状態管理
  const [preview, setPreview] = useState<string | null>(null);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [imageAction, setImageAction] = useState<'keep' | 'clear' | 'update'>(
    'keep',
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<NoteFormInput>({
    resolver: zodResolver(noteSchema),
    // フォームの初期値を設定
    defaultValues: {
      title: note.title,
      content: note.content,
    },
  });

  // 編集モード開始/終了時の処理
  useEffect(() => {
    if (isEditing) {
      // 編集開始時に初期状態を設定
      setPreview(note.imageUrl ?? null);
      setNewImageFile(null);
      setImageAction('keep');
    } else {
      // 編集終了時にstateをリセット
      setPreview(null);
      setNewImageFile(null);
      setImageAction('keep');
    }
  }, [isEditing, note.imageUrl]);

  useEffect(() => {
    if (!preview || !preview.startsWith('blob:')) {
      return;
    }

    return () => {
      // メモリリークを防ぐために、生成したURLを解放する
      URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // react-dropzoneのセットアップ
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles[0]) {
      const file = acceptedFiles[0];
      setNewImageFile(file);
      setPreview(URL.createObjectURL(file));
      setImageAction('update');
    }
  }, []);

  const handleClearImage = () => {
    setPreview(null);
    setNewImageFile(null);
    setImageAction('clear');
  };

  const handleCancel = () => {
    setIsEditing(false);

    reset({
      title: note.title,
      content: note.content,
    });
  };

  // フォーム送信時に新しいFileオブジェクトをFormDataに追加する
  const onSubmit = (data: NoteFormInput) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('content', data.content);
    formData.append('imageAction', imageAction);

    if (imageAction === 'update' && newImageFile) {
      formData.set('image', newImageFile);
    } else {
      formData.delete('image');
    }
    formData.set('imageAction', imageAction);

    updateNote({ id: note.id, formData });
    setIsEditing(false);
  };

  return {
    isEditing,
    preview,
    imageAction,
    onDrop,
    handleClearImage,
    handleCancel,
    setIsEditing,
    register,
    handleSubmit,
    errors,
    onSubmit,
  };
};
