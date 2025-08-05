// app/error.tsx
'use client';

import { useEffect } from 'react';
import { Button } from './components/ui/button';

const NotesError = ({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) => {
  useEffect(() => {
    // エラーロギングサービスなどにエラー情報を送信する
    console.error(error);
  }, [error]);

  return (
    <div className="container mx-auto mt-10 max-w-4xl text-center">
      <h2 className="text-2xl font-bold text-red-600 mb-4">
        エラーが発生しました
      </h2>
      <p className="mb-6">ノートの読み込み中に予期せぬエラーが発生しました。</p>
      <Button
        onClick={
          // reset()関数を呼び出すことで、ページコンポーネントを再レンダリングしようと試みる
          () => reset()
        }
      >
        もう一度試す
      </Button>
    </div>
  );
};

export default NotesError;
