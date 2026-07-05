'use client';

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification as firebaseSendEmailVerification,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  onSnapshot,
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
  name: string;
  mobile?: string;
  emailVerified: boolean;
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  done: boolean;
  createdAt: number;
  imageUrl?: string;
}

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

// Registration: creates Firebase Auth user, saves to Firestore, sends verification email
export async function signUp(
  name: string,
  email: string,
  mobile: string,
  pin: string,
  password: string
): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const fbUser = userCredential.user;

  await setDoc(doc(db, 'users', fbUser.uid), {
    name,
    email,
    mobile,
    pin,
    createdAt: new Date().toISOString(),
    emailVerified: false,
  });

  await firebaseSendEmailVerification(fbUser);

  return {
    uid: fbUser.uid,
    email,
    name,
    mobile,
    emailVerified: false,
  };
}

// PIN login: queries Firestore by email, verifies PIN, returns user (no Firebase Auth session)
export async function loginWithPin(email: string, pin: string): Promise<User> {
  const snapshot = await getDocs(
    query(collection(db, 'users'), where('email', '==', email))
  );

  if (snapshot.empty) {
    throw new Error('No account found with this email');
  }

  const userDoc = snapshot.docs[0];
  const data = userDoc.data();

  if (data.pin !== pin) {
    throw new Error('Incorrect PIN');
  }

  if (!data.emailVerified) {
    throw new Error('EMAIL_NOT_VERIFIED');
  }

  return {
    uid: userDoc.id,
    email: data.email,
    name: data.name,
    mobile: data.mobile,
    emailVerified: true,
  };
}

// Password login: uses Firebase Auth (session persisted)
export async function login(email: string, password: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const fbUser = userCredential.user;

  const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
  const data = userDoc.data();

  return {
    uid: fbUser.uid,
    email: fbUser.email || '',
    name: data?.name || data?.displayName || '',
    mobile: data?.mobile,
    emailVerified: fbUser.emailVerified,
  };
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

// Reloads Firebase Auth user, marks Firestore emailVerified if confirmed
export async function checkAndMarkEmailVerified(uid: string): Promise<boolean> {
  const currentUser = auth.currentUser;
  if (!currentUser) return false;
  await currentUser.reload();
  if (currentUser.emailVerified) {
    await updateDoc(doc(db, 'users', uid), { emailVerified: true });
    return true;
  }
  return false;
}

export async function resendVerificationEmail(): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('No authenticated user');
  await firebaseSendEmailVerification(currentUser);
}

// Reloads Firebase Auth user and returns fresh User object
export async function getRefreshedUser(): Promise<User | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  await currentUser.reload();
  const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
  const data = userDoc.data();
  return {
    uid: currentUser.uid,
    email: currentUser.email || '',
    name: data?.name || data?.displayName || '',
    mobile: data?.mobile,
    emailVerified: currentUser.emailVerified,
  };
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
      const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
      const data = userDoc.data();
      callback({
        uid: fbUser.uid,
        email: fbUser.email || '',
        name: data?.name || data?.displayName || '',
        mobile: data?.mobile,
        emailVerified: fbUser.emailVerified,
      });
    } else {
      callback(null);
    }
  });
}

// User category functions
export async function getUserCategories(uid: string): Promise<string[]> {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (userDoc.exists()) {
    return userDoc.data().customCategories || [];
  }
  return [];
}

export async function saveUserCategory(uid: string, category: string): Promise<void> {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (!userDoc.exists()) return;
  const existing: string[] = userDoc.data().customCategories || [];
  if (!existing.includes(category)) {
    await updateDoc(doc(db, 'users', uid), {
      customCategories: [...existing, category],
    });
  }
}

// Shopping list functions
export async function initializeShoppingList(dateStr: string, userId: string) {
  const docId = `${userId}_${dateStr}`;
  const docRef = doc(db, 'shopping_lists', docId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
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

export function subscribeToShoppingList(
  dateStr: string,
  userId: string,
  callback: (items: ShoppingItem[]) => void
) {
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
