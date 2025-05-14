
'use server';

import { db } from '@/lib/firebase';
import type { DailyEntry } from '@/lib/types';
import { doc, setDoc, collection, getDocs, query, getDoc } from 'firebase/firestore'; // Removed 'where' as it might not be needed for generic path

interface SaveToFirestoreResult {
  success: boolean;
  error?: string;
  docId?: string;
}

// Simplified to save to a generic 'moodEntries' collection
const FIRESTORE_COLLECTION_PATH = 'moodEntries_global'; // Generic path

export async function saveEntryToFirestore(entry: DailyEntry): Promise<SaveToFirestoreResult> {
  if (!db) {
    const errorMessage = 'Firestore is not initialized. Check Firebase configuration.';
    console.error(`[SaveToFirestore] ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
  if (!entry || !entry.date) {
    console.error('[SaveToFirestore] Invalid entry data provided.');
    return { success: false, error: 'Invalid entry data provided.' };
  }

  try {
    const docRef = doc(db, FIRESTORE_COLLECTION_PATH, entry.date);
    await setDoc(docRef, entry);
    console.log('[SaveToFirestore] Document written to global collection with ID:', entry.date);
    return { success: true, docId: entry.date };
  } catch (e: any) {
    console.error('[SaveToFirestore] Error adding document to global collection:', e);
    let userFriendlyError = 'Failed to save entry to Firestore.';
    if (e.code === 'permission-denied') {
        userFriendlyError = "Permission denied. Check Firestore security rules for global collection.";
    } else if (e.message) {
        userFriendlyError = `Failed to save entry to Firestore: ${e.message}`;
    }
    return { success: false, error: userFriendlyError };
  }
}

export async function getEntryFromFirestore(date: string): Promise<DailyEntry | null> {
  if (!db) return null;
  try {
    const docRef = doc(db, FIRESTORE_COLLECTION_PATH, date);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as DailyEntry;
    }
    return null;
  } catch (error) {
    console.error("[GetEntryFromFirestore] Error fetching entry from global collection:", error);
    return null;
  }
}

export async function getAllEntriesFromFirestore(): Promise<Record<string, DailyEntry>> {
  if (!db) return {};
  try {
    const entriesCollectionRef = collection(db, FIRESTORE_COLLECTION_PATH);
    const q = query(entriesCollectionRef); // Simple query for all documents
    const querySnapshot = await getDocs(q);
    const entries: Record<string, DailyEntry> = {};
    querySnapshot.forEach((doc) => {
      entries[doc.id] = doc.data() as DailyEntry;
    });
    return entries;
  } catch (error) {
    console.error("[GetAllEntriesFromFirestore] Error fetching entries from global collection:", error);
    return {};
  }
}
