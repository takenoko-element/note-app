// app/notes/components/NewNoteForm.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { default as NextImage } from 'next/image';
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
import { Loader2, UploadCloud } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

type NewNoteFormProps = {
  addNote: (formData: FormData) => void;
  isAdding: boolean;
};

export const NewNoteForm = ({ addNote, isAdding }: NewNoteFormProps) => {
  const formRef = useRef<HTMLFormElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // ファイルがドロップされたときの処理
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles[0]) {
      const file = acceptedFiles[0];
      setImageFile(file);
      // プレビュー用のURLを生成
      setPreview(URL.createObjectURL(file));
    }
  }, []);

  // react-dropzoneのセットアップ
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
    noClick: false, // `open`関数でクリックを許可するために`false`に
    noKeyboard: true,
  });

  // プレビューURLのメモリリークを防ぐためのクリーンアップ
  useEffect(() => {
    if (!preview || !preview.startsWith('blob:')) {
      return;
    }

    return () => {
      URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // フォームの送信処理
  const handleFormSubmit = (formData: FormData) => {
    // 状態に保持している画像ファイルがあれば、FormDataに追加
    if (imageFile) {
      formData.set('image', imageFile);
    }
    addNote(formData);
    // フォームと状態をリセット
    formRef.current?.reset();
    setImageFile(null);
    setPreview(null);
  };

  // プレビューをクリアする処理
  const handleClearPreview = () => {
    setImageFile(null);
    setPreview(null);
  };

  return (
    <Card className="mb-10">
      <CardHeader>
        <CardTitle>新しいノートの作成</CardTitle>
      </CardHeader>
      <form ref={formRef} action={handleFormSubmit} className="space-y-4">
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
            <label className="text-sm font-medium">画像</label>
            <div
              {...getRootProps()}
              className={`mt-1 border-2 border-dashed rounded-lg p-4 text-center transition-colors
                ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
                ${preview ? 'h-48' : 'h-24'} flex items-center justify-center relative`}
              data-testid="dropzone-area"
            >
              {/* inputは非表示だが、dropzoneのために必要 */}
              <input {...getInputProps()} data-testid="dropzone-input" />

              {preview ? (
                <NextImage
                  src={preview}
                  alt="プレビュー"
                  fill
                  className="object-contain rounded-md"
                  sizes="100vw"
                />
              ) : (
                <div className="text-gray-500">
                  <UploadCloud className="mx-auto h-8 w-8" />
                  <p>画像をドラッグ＆ドロップ</p>
                  <p className="text-xs">または下のボタンからファイルを選択</p>
                </div>
              )}
            </div>
            <div className="mt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={open}
                disabled={isAdding}
              >
                画像を選択
              </Button>
              {preview && (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={handleClearPreview}
                  disabled={isAdding}
                >
                  画像をクリア
                </Button>
              )}
            </div>
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
