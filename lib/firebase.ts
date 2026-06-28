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

// Seed data for first launch
export const seedData: Record<string, ShoppingItem[]> = {
  'cleaning-supplies': [
    { id: '1', name: 'Dish soap', category: 'Cleaning Supplies', done: true, createdAt: Date.now() },
    { id: '2', name: 'Laundry detergent', category: 'Cleaning Supplies', done: true, createdAt: Date.now() },
    { id: '3', name: 'Paper towels', category: 'Cleaning Supplies', done: true, createdAt: Date.now() },
    { id: '4', name: 'Sponges', category: 'Cleaning Supplies', done: true, createdAt: Date.now() },
    { id: '5', name: 'Trash bags', category: 'Cleaning Supplies', done: true, createdAt: Date.now() },
    { id: '6', name: 'Bleach', category: 'Cleaning Supplies', done: true, createdAt: Date.now() },
  ],
  'kitchen': [
    { id: '7', name: 'Olive oil', category: 'Kitchen', done: true, createdAt: Date.now() },
    { id: '8', name: 'Salt & pepper', category: 'Kitchen', done: true, createdAt: Date.now() },
    { id: '9', name: 'Flour', category: 'Kitchen', done: true, createdAt: Date.now() },
    { id: '10', name: 'Sugar', category: 'Kitchen', done: true, createdAt: Date.now() },
    { id: '11', name: 'Butter', category: 'Kitchen', done: true, createdAt: Date.now() },
    { id: '12', name: 'Baking powder', category: 'Kitchen', done: true, createdAt: Date.now() },
  ],
  'produce': [
    { id: '13', name: 'Apples', category: 'Produce', done: false, createdAt: Date.now() },
    { id: '14', name: 'Bananas', category: 'Produce', done: false, createdAt: Date.now() },
    { id: '15', name: 'Carrots', category: 'Produce', done: false, createdAt: Date.now() },
    { id: '16', name: 'Broccoli', category: 'Produce', done: false, createdAt: Date.now() },
    { id: '17', name: 'Spinach', category: 'Produce', done: false, createdAt: Date.now() },
    { id: '18', name: 'Tomatoes', category: 'Produce', done: false, createdAt: Date.now() },
  ],
  'meat-fish': [
    { id: '19', name: 'Chicken breast', category: 'Meat & Fish', done: false, createdAt: Date.now() },
    { id: '20', name: 'Ground beef', category: 'Meat & Fish', done: false, createdAt: Date.now() },
    { id: '21', name: 'Salmon fillets', category: 'Meat & Fish', done: false, createdAt: Date.now() },
    { id: '22', name: 'Shrimp', category: 'Meat & Fish', done: false, createdAt: Date.now() },
    { id: '23', name: 'Bacon', category: 'Meat & Fish', done: false, createdAt: Date.now() },
  ],
  'dairy': [
    { id: '24', name: 'Milk', category: 'Dairy', done: false, createdAt: Date.now() },
    { id: '25', name: 'Cheese', category: 'Dairy', done: false, createdAt: Date.now() },
    { id: '26', name: 'Yogurt', category: 'Dairy', done: false, createdAt: Date.now() },
    { id: '27', name: 'Eggs', category: 'Dairy', done: false, createdAt: Date.now() },
    { id: '28', name: 'Cream', category: 'Dairy', done: false, createdAt: Date.now() },
  ],
  'frozen': [
    { id: '29', name: 'Frozen vegetables', category: 'Frozen', done: false, createdAt: Date.now() },
    { id: '30', name: 'Ice cream', category: 'Frozen', done: false, createdAt: Date.now() },
    { id: '31', name: 'Frozen pizza', category: 'Frozen', done: false, createdAt: Date.now() },
    { id: '32', name: 'Frozen berries', category: 'Frozen', done: false, createdAt: Date.now() },
  ],
  'snacks': [
    { id: '33', name: 'Chips', category: 'Snacks', done: false, createdAt: Date.now() },
    { id: '34', name: 'Crackers', category: 'Snacks', done: false, createdAt: Date.now() },
    { id: '35', name: 'Popcorn', category: 'Snacks', done: false, createdAt: Date.now() },
    { id: '36', name: 'Cookies', category: 'Snacks', done: false, createdAt: Date.now() },
    { id: '37', name: 'Granola bars', category: 'Snacks', done: false, createdAt: Date.now() },
  ],
  'beverages': [
    { id: '38', name: 'Coffee', category: 'Beverages', done: false, createdAt: Date.now() },
    { id: '39', name: 'Tea', category: 'Beverages', done: false, createdAt: Date.now() },
    { id: '40', name: 'Orange juice', category: 'Beverages', done: false, createdAt: Date.now() },
    { id: '41', name: 'Sparkling water', category: 'Beverages', done: false, createdAt: Date.now() },
  ],
};

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
    // First time - seed with default items
    const seedItems = Object.values(seedData).flat();
    await setDoc(docRef, {
      userId,
      date: dateStr,
      items: seedItems,
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
