// app/auth/UserProfileClient.tsx
'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { requestPasswordChangeAction } from '@/app/actions/auth.actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';

type UserProfileClientProps = {
  user: {
    name?: string | null;
    picture?: string | null;
  };
};

export const UserProfileClient = ({ user }: UserProfileClientProps) => {
  const [isPending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handlePasswordChange = () => {
    startTransition(async () => {
      try {
        const result = await requestPasswordChangeAction();
        toast.success(result.message);
        setIsDialogOpen(false);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : '予期せぬエラーが発生しました。',
        );
      }
    });
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <div className="flex items-center gap-4">
        <Image
          src={user.picture ?? ''}
          alt={user.name ?? 'user picture'}
          width={40}
          height={40}
          className="rounded-full"
        />
        <div>
          <p className="font-semibold">{user.name}</p>
          <div className="flex items-center gap-2 text-sm">
            <DialogTrigger asChild>
              <button className="text-gray-500 hover:underline">
                パスワード変更
              </button>
            </DialogTrigger>
            <a href="/auth/logout" className="text-gray-500 hover:underline">
              ログアウト
            </a>
          </div>
        </div>
      </div>

      {/* ↓ここからがダイアログの中身↓ */}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>パスワード変更の確認</DialogTitle>
          <DialogDescription>
            登録されているメールアドレスにパスワード変更用のリンクを送信します。よろしいですか？
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
            キャンセル
          </Button>
          <Button onClick={handlePasswordChange} disabled={isPending}>
            {isPending ? '送信中...' : '送信する'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
