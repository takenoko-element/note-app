// app/components/layout/Header.tsx
import { UserProfile } from '@/app/components/auth/UserProfile';

export const Header = () => {
  return (
    <header className="p-4 flex justify-between items-center border-b">
      <h1 className="text-2xl font-bold">Note App</h1>
      <UserProfile />
    </header>
  );
};
