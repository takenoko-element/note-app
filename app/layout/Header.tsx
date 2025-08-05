// app/components/layout/Header.tsx
import { UserProfile } from '@/app/auth/UserProfile';
import Link from 'next/link';

export const Header = () => {
  return (
    <header className="p-4 flex justify-between items-center border-b">
      <Link href={'/'} className="hover:underline">
        <h1 className="text-2xl font-bold">Note App</h1>
      </Link>
      <UserProfile />
    </header>
  );
};
