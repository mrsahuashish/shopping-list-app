'use client';

import ProfileMenu from './profile-menu';
import { useAuth } from '@/lib/auth-context';

interface HeaderProps {
  onAddItem?: () => void;
  onLogout?: () => void;
}

export default function Header({ onAddItem, onLogout }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold leading-tight">Shopping List</h1>
        {user && <p className="text-xs text-slate-400 mt-0.5">Hello, {user.name || 'there'}</p>}
      </div>
      <div className="flex items-center gap-2.5">
        {onAddItem && (
          <button
            onClick={onAddItem}
            className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 flex items-center justify-center text-white transition-colors"
            aria-label="Add item"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
        {user && (
          <ProfileMenu name={user.name} email={user.email} onLogout={onLogout || (() => {})} />
        )}
      </div>
    </header>
  );
}
