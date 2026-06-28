'use client';

import { useState } from 'react';
import { logout } from '@/lib/firebase';

interface ProfileMenuProps {
  displayName?: string;
  email: string;
  onLogout: () => void;
}

export default function ProfileMenu({ displayName, email, onLogout }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold hover:bg-blue-700 transition-colors"
      >
        {displayName?.[0].toUpperCase() || 'U'}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-slate-200">
            <p className="font-semibold text-slate-900">{displayName}</p>
            <p className="text-sm text-slate-600">{email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors font-medium"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
