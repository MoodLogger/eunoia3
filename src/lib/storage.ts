
import type { DailyEntry, StoredData, ThemeScores, DetailedThemeScores, ThemeQuestionScores } from './types';
import { themeOrder } from '@/components/theme-assessment';
import { 
  saveEntryToFirestore, 
  getEntryFromFirestore, 
  getAllEntriesFromFirestore 
} from '@/actions/save-entry-to-firestore'; // Actions now include Firestore reads

const LOCAL_STORAGE_KEY = 'moodLoggerData_anonymous'; // Use a different key for anonymous local storage

function createDefaultDetailedScores(): DetailedThemeScores {
  const defaultQuestionScores: ThemeQuestionScores = {};
  for (let i = 0; i < 8; i++) defaultQuestionScores[i] = 0;
  const defaultDetailedScores = {} as DetailedThemeScores;
  themeOrder.forEach(theme => {
    defaultDetailedScores[theme] = typeof structuredClone === 'function' ? structuredClone(defaultQuestionScores) : JSON.parse(JSON.stringify(defaultQuestionScores));
  });
  return defaultDetailedScores;
}

function createDefaultThemeScores(): ThemeScores {
  const defaultScores = {} as ThemeScores;
  themeOrder.forEach(theme => { defaultScores[theme] = 0; });
  return defaultScores;
}

function getLocalStoredData(): StoredData {
  if (typeof window === 'undefined') return {};
  try {
    const rawData = localStorage.getItem(LOCAL_STORAGE_KEY);
    return rawData ? JSON.parse(rawData) : {};
  } catch (error) {
    console.error("[LocalStorage] Error reading data:", error);
    return {};
  }
}

function saveLocalStoredData(data: StoredData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("[LocalStorage] Error saving data:", error);
  }
}

function validateAndCompleteEntry(entry: Partial<DailyEntry>, date: string): DailyEntry {
    const defaultDetailed = createDefaultDetailedScores();
    const defaultOverall = createDefaultThemeScores();

    const detailedScores = { ...defaultDetailed, ...(entry.detailedScores || {}) };
    themeOrder.forEach(theme => {
        detailedScores[theme] = { ...(defaultDetailed[theme] || {}), ...(entry.detailedScores?.[theme] || {}) };
        for (let i = 0; i < 8; i++) {
            if (detailedScores[theme][i] === undefined) detailedScores[theme][i] = 0;
        }
    });

    const scores = { ...defaultOverall, ...(entry.scores || {}) };
     themeOrder.forEach(theme => {
        if (scores[theme] === undefined) scores[theme] = 0;
    });

    return {
        date: entry.date || date,
        mood: entry.mood !== undefined ? entry.mood : null,
        scores: scores,
        detailedScores: detailedScores,
    };
}


export async function getDailyEntry(date: string, userId?: string): Promise<DailyEntry> {
  if (userId && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    console.log(`[Storage] Attempting to fetch entry for user ${userId}, date ${date} from Firestore.`);
    const firestoreEntry = await getEntryFromFirestore(userId, date);
    if (firestoreEntry) {
      console.log(`[Storage] Fetched entry from Firestore for user ${userId}, date ${date}.`);
      return validateAndCompleteEntry(firestoreEntry, date);
    }
    console.log(`[Storage] No entry in Firestore for user ${userId}, date ${date}. Creating default.`);
  } else if (userId) {
      console.warn(`[Storage] User ID provided but Firestore is not configured (NEXT_PUBLIC_FIREBASE_PROJECT_ID missing). Falling back to local for ${date}.`);
  }


  // Fallback to local storage or create new default if no userId or Firestore fetch failed/not applicable
  const localData = getLocalStoredData();
  const localEntry = localData[date];
  if (localEntry) {
      console.log(`[Storage] Fetched entry from LocalStorage for date ${date}.`);
      return validateAndCompleteEntry(localEntry, date);
  }
  
  console.log(`[Storage] No entry in LocalStorage for date ${date}. Creating default.`);
  return validateAndCompleteEntry({ date }, date);
}

export async function saveDailyEntry(entry: DailyEntry, userId?: string): Promise<void> {
  const completeEntry = validateAndCompleteEntry(entry, entry.date);

  // Always save to local storage for immediate UI and offline (if user is anonymous)
  if (typeof window !== 'undefined' && !userId) { // Only save to anonymous local storage if no user
    const localData = getLocalStoredData();
    localData[entry.date] = completeEntry;
    saveLocalStoredData(localData);
    console.log('[LocalStorage] Anonymous entry saved for date:', entry.date);
  }

  // If userId is provided and Firestore is configured, save to Firestore
  if (userId && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    console.log(`[Storage] Attempting to save entry to Firestore for user ${userId}, date ${entry.date}.`);
    const firestoreResult = await saveEntryToFirestore(userId, completeEntry);
    if (firestoreResult.success) {
      console.log('[Storage] Entry saved to Firestore for user:', userId, 'date:', entry.date);
    } else {
      console.error('[Storage] Failed to save entry to Firestore for user:', userId, 'Error:', firestoreResult.error);
      // Potentially inform user via toast if critical, or rely on local save for now
    }
  } else if (userId) {
    console.warn(`[Storage] User ID provided for save, but Firestore is not configured (NEXT_PUBLIC_FIREBASE_PROJECT_ID missing). Entry NOT saved to Firestore for user ${userId}, date ${entry.date}.`);
  }
}

export async function getAllEntries(userId?: string): Promise<StoredData> {
  if (userId && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    console.log(`[Storage] Attempting to fetch all entries for user ${userId} from Firestore.`);
    const firestoreEntries = await getAllEntriesFromFirestore(userId);
     // Validate each entry
    const validatedEntries: StoredData = {};
    for (const date in firestoreEntries) {
        validatedEntries[date] = validateAndCompleteEntry(firestoreEntries[date], date);
    }
    console.log(`[Storage] Fetched ${Object.keys(validatedEntries).length} entries from Firestore for user ${userId}.`);
    return validatedEntries;
  } else if (userId) {
    console.warn(`[Storage] User ID provided for getAllEntries, but Firestore is not configured. Falling back to local.`);
  }
  
  // Fallback to local storage
  const localData = getLocalStoredData();
  const validatedLocalData: StoredData = {};
    for (const date in localData) {
        validatedLocalData[date] = validateAndCompleteEntry(localData[date], date);
    }
  console.log(`[Storage] Fetched ${Object.keys(validatedLocalData).length} entries from LocalStorage.`);
  return validatedLocalData;
}


export function calculateOverallScores(detailedScores: DetailedThemeScores): ThemeScores {
    const overallScores = {} as ThemeScores;
    themeOrder.forEach(theme => {
        const themeQuestions = detailedScores[theme];
        let sum = 0;
        if (themeQuestions) {
            for (let i = 0; i < 8; i++) {
                sum += themeQuestions[i] ?? 0;
            }
        }
        overallScores[theme] = Math.max(-2, Math.min(2, parseFloat(sum.toFixed(2))));
    });
    return overallScores;
}
