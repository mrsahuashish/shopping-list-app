'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, subscribeToAuth, logout, getRefreshedUser } from './firebase';

const PIN_USER_KEY = 'slapp_pin_user';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setManualUser: (user: User) => void;
  signOutUser: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [pinUser, setPinUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Firebase Auth user takes precedence over PIN user
  const user = firebaseUser || pinUser;

  useEffect(() => {
    // Restore PIN session from localStorage before Firebase resolves,
    // so there is no flash of the auth screen on refresh.
    const saved = localStorage.getItem(PIN_USER_KEY);
    if (saved) {
      try {
        setPinUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem(PIN_USER_KEY);
      }
    }

    const unsubscribe = subscribeToAuth((currentUser) => {
      setFirebaseUser(currentUser);
      // If Firebase has a live session, the PIN session is no longer needed.
      if (currentUser) {
        setPinUser(null);
        localStorage.removeItem(PIN_USER_KEY);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const setManualUser = (user: User) => {
    setPinUser(user);
    localStorage.setItem(PIN_USER_KEY, JSON.stringify(user));
  };

  const signOutUser = async () => {
    setPinUser(null);
    localStorage.removeItem(PIN_USER_KEY);
    await logout();
  };

  const refreshUser = async () => {
    const updated = await getRefreshedUser();
    if (updated) {
      setFirebaseUser(updated);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, setManualUser, signOutUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
