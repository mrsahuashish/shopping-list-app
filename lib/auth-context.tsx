'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, subscribeToAuth, logout, getRefreshedUser } from './firebase';

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
    const unsubscribe = subscribeToAuth((currentUser) => {
      setFirebaseUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const setManualUser = (user: User) => {
    setPinUser(user);
  };

  const signOutUser = async () => {
    setPinUser(null);
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
