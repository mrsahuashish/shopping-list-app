'use client';

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "my-shopping-list-fcc58.firebaseapp.com",
  projectId: "my-shopping-list-fcc58",
  storageBucket: "my-shopping-list-fcc58.firebasestorage.app",
  messagingSenderId: "141283356923",
  appId: "1:141283356923:web:e93b822571f35f9cf0805e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export interface User {
  uid: string;
  email: string;
  displayName?: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  done: boolean;
  createdAt: number;
}

// No seed data - users start with empty lists

export const categoryEmojis: Record<string, string> = {
  'Cleaning Supplies': '🧹',
  'Kitchen': '🍳',
  'Produce': '🥬',
  'Meat & Fish': '🍗',
  'Dairy': '🧈',
  'Frozen': '🧊',
  'Snacks': '🍪',
  'Beverages': '☕',
};

// Authentication functions
export async function signUp(email: string, password: string, displayName: string): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;
  
  // Save user profile to Firestore
  await setDoc(doc(db, 'users', firebaseUser.uid), {
    email: firebaseUser.email,
    displayName,
    createdAt: new Date().toISOString(),
  });
  
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName,
  };
}

export async function login(email: string, password: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;
  
  // Get user profile
  const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
  const userData = userDoc.data();
  
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: userData?.displayName,
  };
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      const userData = userDoc.data();
      
      callback({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: userData?.displayName,
      });
    } else {
      callback(null);
    }
  });
}

// Shopping list functions
export async function initializeShoppingList(dateStr: string, userId: string) {
  const docId = `${userId}_${dateStr}`;
  const docRef = doc(db, 'shopping_lists', docId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    // Create empty list for new date
    await setDoc(docRef, {
      userId,
      date: dateStr,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}

export async function getShoppingList(dateStr: string, userId: string): Promise<ShoppingItem[]> {
  const docId = `${userId}_${dateStr}`;
  const docSnap = await getDoc(doc(db, 'shopping_lists', docId));
  
  if (docSnap.exists()) {
    return docSnap.data().items || [];
  }
  return [];
}

export async function addItem(dateStr: string, userId: string, item: ShoppingItem) {
  const docId = `${userId}_${dateStr}`;
  const docRef = doc(db, 'shopping_lists', docId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const items = docSnap.data().items || [];
    await updateDoc(docRef, {
      items: [...items, item],
      updatedAt: new Date().toISOString(),
    });
  }
}

export async function toggleItem(dateStr: string, userId: string, itemId: string) {
  const docId = `${userId}_${dateStr}`;
  const docRef = doc(db, 'shopping_lists', docId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const items = docSnap.data().items || [];
    const updatedItems = items.map((item: ShoppingItem) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    
    await updateDoc(docRef, {
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    });
  }
}

export async function deleteItem(dateStr: string, userId: string, itemId: string) {
  const docId = `${userId}_${dateStr}`;
  const docRef = doc(db, 'shopping_lists', docId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const items = docSnap.data().items || [];
    const updatedItems = items.filter((item: ShoppingItem) => item.id !== itemId);
    
    await updateDoc(docRef, {
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    });
  }
}

export function subscribeToShoppingList(dateStr: string, userId: string, callback: (items: ShoppingItem[]) => void) {
  const docId = `${userId}_${dateStr}`;
  const docRef = doc(db, 'shopping_lists', docId);
  
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data().items || []);
    } else {
      callback([]);
    }
  });
}
