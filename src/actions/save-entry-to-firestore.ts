
'use server';

import { db } from '@/lib/firebase';
import type { DailyEntry } from '@/lib/types';
import { doc, setDoc, collection, getDocs, query, where, getDoc } from 'firebase/firestore';

interface SaveToFirestoreResult {
  success: boolean;
  error?: string;
  docId?: string;
}

export async function saveEntryToFirestore(userId: string, entry: DailyEntry): Promise<SaveToFirestoreResult> {
  if (!db) {
    const errorMessage = 'Firestore is not initialized. Check Firebase configuration.';
    console.error(`[SaveToFirestore] ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
  if (!userId) {
    console.error('[SaveToFirestore] User ID is required to save to Firestore.');
    return { success: false, error: 'User ID is required.' };
  }
  if (!entry || !entry.date) {
    console.error('[SaveToFirestore] Invalid entry data provided.');
    return { success: false, error: 'Invalid entry data provided.' };
  }

  try {
    // Path: users/{userId}/moodEntries/{date}
    const docRef = doc(db, 'users', userId, 'moodEntries', entry.date);
    await setDoc(docRef, entry);
    console.log('[SaveToFirestore] Document written for user', userId, 'with ID:', entry.date);
    return { success: true, docId: entry.date };
  } catch (e: any) {
    console.error('[SaveToFirestore] Error adding document for user', userId, ':', e);
    let userFriendlyError = 'Failed to save entry to Firestore.';
    if (e.code === 'permission-denied') {
        userFriendlyError = "Permission denied. Check Firestore security rules.";
    } else if (e.message) {
        userFriendlyError = `Failed to save entry to Firestore: ${e.message}`;
    }
    return { success: false, error: userFriendlyError };
  }
}

// New action to get a single entry
export async function getEntryFromFirestore(userId: string, date: string): Promise<DailyEntry | null> {
  if (!db || !userId) return null;
  try {
    const docRef = doc(db, 'users', userId, 'moodEntries', date);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as DailyEntry;
    }
    return null;
  } catch (error) {
    console.error("[GetEntryFromFirestore] Error fetching entry:", error);
    return null;
  }
}

// New action to get all entries for a user
export async function getAllEntriesFromFirestore(userId: string): Promise<Record<string, DailyEntry>> {
  if (!db || !userId) return {};
  try {
    const entriesCollectionRef = collection(db, 'users', userId, 'moodEntries');
    const q = query(entriesCollectionRef);
    const querySnapshot = await getDocs(q);
    const entries: Record<string, DailyEntry> = {};
    querySnapshot.forEach((doc) => {
      entries[doc.id] = doc.data() as DailyEntry;
    });
    return entries;
  } catch (error) {
    console.error("[GetAllEntriesFromFirestore] Error fetching entries:", error);
    return {};
  }
}
