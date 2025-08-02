// app/components/auth/UserProfile.tsx
import { auth0 } from '@/lib/auth0';
import { UserProfileClient } from './UserProfileClient';

export const UserProfile = async () => {
  const session = await auth0.getSession();
  const user = session?.user;

  if (user) {
    return <UserProfileClient user={user} />;
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
