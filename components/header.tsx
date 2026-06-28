'use client';

import ProfileMenu from './profile-menu';
import { useAuth } from '@/lib/auth-context';

interface HeaderProps {
  onLogout?: () => void;
}

export default function Header({ onLogout }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="bg-slate-900 text-white px-4 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Shopping List</h1>
        {user && <p className="text-sm text-slate-300">Hello, {user.displayName || 'there'}</p>}
      </div>
      {user && <ProfileMenu displayName={user.displayName} email={user.email} onLogout={onLogout || (() => {})} />}
    </header>
  );
}
