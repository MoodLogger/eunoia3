
'use server';

import { db } from '@/lib/firebase';
import type { DailyEntry } from '@/lib/types';
import { doc, setDoc } from 'firebase/firestore';

interface SaveToFirestoreResult {
  success: boolean;
  error?: string;
  docId?: string;
}

export async function saveEntryToFirestore(entry: DailyEntry): Promise<SaveToFirestoreResult> {
  if (!db) {
    const errorMessage = 'Firestore is not initialized. Check Firebase configuration in .env.local (NEXT_PUBLIC_FIREBASE_PROJECT_ID is required) and ensure Firebase is set up in your project.';
    console.error(`[SaveToFirestore] ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
  if (!entry || !entry.date) {
    console.error('[SaveToFirestore] Invalid entry data provided.');
    return { success: false, error: 'Invalid entry data provided.' };
  }

  try {
    // Using date as document ID in a collection 'moodEntries'
    const docRef = doc(db, 'moodEntries', entry.date);
    await setDoc(docRef, entry);
    console.log('[SaveToFirestore] Document written with ID: ', entry.date);
    return { success: true, docId: entry.date };
  } catch (e: any) {
    console.error('[SaveToFirestore] Error adding document: ', e);
    // Check for specific Firestore errors if needed, e.g., permission denied
    let userFriendlyError = 'Failed to save entry to Firestore.';
    if (e.code === 'permission-denied') {
        userFriendlyError = "Permission denied. Check Firestore security rules.";
    } else if (e.message) {
        userFriendlyError = `Failed to save entry to Firestore: ${e.message}`;
    }
    return { success: false, error: userFriendlyError };
  }
}
