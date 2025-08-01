// app/components/auth/UserProfile.tsx
import { auth0 } from '@/lib/auth0';
import Image from 'next/image';

export const UserProfile = async () => {
  const session = await auth0.getSession();
  const user = session?.user;

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <Image
          src={user.picture ?? ''}
          alt={user.name ?? 'user picture'}
          width={40} // `width`と`height`の指定が必須
          height={40}
          className="rounded-full"
        />
        <div>
          <p className="font-semibold">{user.name}</p>
          <a
            href="/auth/logout"
            className="text-sm text-gray-500 hover:underline"
          >
            ログアウト
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <a
        href="/auth/login"
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        ログイン
      </a>
    </>
  );
};
