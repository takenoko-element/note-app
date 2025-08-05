// app/notes/components/NoteCard.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Button } from '@/app/components/ui/button';
import { Loader2, Pencil, Trash2, UploadCloud } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

import { Note } from '@/types';
import Link from 'next/link';
import { default as NextImage } from 'next/image';

type NoteCardProps = {
  note: Note;
  updateNote: (variables: { id: number; formData: FormData }) => void;
  isUpdating: boolean;
  deleteNote: (id: number) => void;
  isDeleting: boolean;
};

export const NoteCard = ({
  note,
  updateNote,
  isUpdating,
  deleteNote,
  isDeleting,
}: NoteCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  // 画像編集用の状態管理
  const [preview, setPreview] = useState<string | null>(null);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [imageAction, setImageAction] = useState<'keep' | 'clear' | 'update'>(
    'keep',
  );

  // react-dropzoneのセットアップ
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles[0]) {
      const file = acceptedFiles[0];
      setNewImageFile(file);
      setPreview(URL.createObjectURL(file));
      setImageAction('update');
    }
  }, []);
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
    noClick: false, // Dropzone自体をクリックしてもダイアログが開かないようにする
    noKeyboard: true, // キーボード操作でもダイアログが開かないようにする
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

  const handleClearImage = () => {
    setPreview(null);
    setNewImageFile(null);
    setImageAction('clear');
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  // フォーム送信時に新しいFileオブジェクトをFormDataに追加する
  const handleFormAction = (formData: FormData) => {
    if (imageAction === 'update' && newImageFile) {
      formData.set('image', newImageFile);
    } else {
      formData.delete('image');
    }
    formData.set('imageAction', imageAction);

    updateNote({ id: note.id, formData });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Card className="flex flex-col h-full">
        <form
          action={handleFormAction}
          className="flex flex-col flex-grow gap-4"
        >
          <CardHeader>
            <Input
              name="title"
              defaultValue={note.title}
              className="text-lg font-bold"
              disabled={isUpdating}
              required
            />
          </CardHeader>
          <CardContent className="flex-grow">
            <Textarea
              name="content"
              defaultValue={note.content}
              className="whitespace-pre-wrap min-h-[100px]"
              disabled={isUpdating}
              required
            />
            <div>
              <label className="text-sm font-medium">画像</label>
              <div
                {...getRootProps()}
                className={`mt-1 border-2 border-dashed rounded-lg p-4 text-center transition-colors
                  ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
                  ${preview ? 'h-48' : 'h-24'} flex items-center justify-center relative`}
              >
                <input {...getInputProps()} name="image" />

                {preview ? (
                  <NextImage
                    src={preview}
                    alt="プレビュー"
                    fill
                    className="object-contain rounded-md"
                  />
                ) : (
                  <div className="text-gray-500">
                    <UploadCloud className="mx-auto h-8 w-8" />
                    <p>画像をドラッグ＆ドロップ</p>
                    <p className="text-xs">またはクリックしてファイルを選択</p>
                  </div>
                )}
              </div>
              <div className="mt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={open}
                >
                  画像を選択
                </Button>
                {preview && (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={handleClearImage}
                  >
                    画像をクリア
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
            >
              キャンセル
            </Button>
            <Button type="submit" size="sm" disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存
            </Button>
          </CardFooter>
        </form>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <Link href={`/notes/${note.id}`} className="hover:underline">
          <CardTitle>{note.title}</CardTitle>
        </Link>
        <CardDescription>
          {new Date(note.createdAt).toLocaleString('ja-JP')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="whitespace-pre-wrap">{note.content}</p>
      </CardContent>
      {note.imageUrl && (
        <div className="relative w-full h-40 px-6 pt-2">
          <div className="relative w-full h-full rounded-md border bg-slate-50 p-1">
            <NextImage
              src={note.imageUrl}
              alt={note.title}
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}
      <CardFooter className="flex justify-end space-x-2 items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(true)}
          disabled={isDeleting}
        >
          <Pencil className="mr-2 h-4 w-4" />
          編集
        </Button>
        <form action={() => deleteNote(note.id)}>
          <Button
            variant="destructive"
            size="sm"
            type="submit"
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Trash2 className="mr-2 h-4 w-4" />
            削除
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};
