// app/notes/components/NoteEditForm.tsx
'use client';

import { default as NextImage } from 'next/image';
import type {
  UseFormRegister,
  FieldErrors,
  UseFormHandleSubmit,
} from 'react-hook-form';
import { useDropzone } from 'react-dropzone';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Loader2, UploadCloud } from 'lucide-react';

import { Note } from '@/types';
import type { NoteFormInput } from '@/lib/validators';

type NoteEditFormProps = {
  note: Note;
  isUpdating: boolean;
  preview: string | null;
  onDrop: (acceptedFiles: File[]) => void;
  handleClearImage: () => void;
  handleCancel: () => void;
  register: UseFormRegister<NoteFormInput>;
  handleSubmit: UseFormHandleSubmit<NoteFormInput>;
  onSubmit: (data: NoteFormInput) => void;
  errors: FieldErrors<NoteFormInput>;
};

export const NoteEditForm = ({
  note,
  isUpdating,
  preview,
  onDrop,
  handleClearImage,
  handleCancel,
  register,
  handleSubmit,
  onSubmit,
  errors,
}: NoteEditFormProps) => {
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
    noClick: false, // Dropzone自体をクリックしてもダイアログが開かないようにする
    noKeyboard: true, // キーボード操作でもダイアログが開かないようにする
  });

  return (
    <Card className="flex flex-col h-full">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col flex-grow gap-4"
      >
        <CardHeader>
          <div>
            <Input
              {...register('title')}
              placeholder="タイトル"
              defaultValue={note.title}
              className="text-lg font-bold"
              disabled={isUpdating}
              aria-invalid={errors.title ? 'true' : 'false'}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">
                {errors.title.message}
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          <div>
            <Textarea
              {...register('content')}
              placeholder="内容"
              defaultValue={note.content}
              className="whitespace-pre-wrap min-h-[100px]"
              disabled={isUpdating}
              aria-invalid={errors.content ? 'true' : 'false'}
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-500">
                {errors.content.message}
              </p>
            )}
          </div>
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
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
                disabled={isUpdating}
                onClick={open}
              >
                画像を選択
              </Button>
              {preview && (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={isUpdating}
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
            disabled={isUpdating}
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
};
