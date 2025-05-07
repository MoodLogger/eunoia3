
import type { DailyEntry, StoredData, ThemeScores, Mood, DetailedThemeScores, ThemeQuestionScores, QuestionScore } from './types';
import { themeOrder } from '@/components/theme-assessment'; // Import themeOrder
import { saveEntryToFirestore } from '@/actions/save-entry-to-firestore'; // Import the new server action

const STORAGE_KEY = 'moodLoggerData';

// Helper to create default detailed scores for all themes
function createDefaultDetailedScores(): DetailedThemeScores {
  const defaultQuestionScores: ThemeQuestionScores = {};
  for (let i = 0; i < 8; i++) {
    defaultQuestionScores[i] = 0; // Default each question to neutral (0)
  }

  const defaultDetailedScores = {} as DetailedThemeScores;
  themeOrder.forEach(theme => {
      // Use structuredClone for deep copy if available, otherwise manual copy
      if (typeof structuredClone === 'function') {
          defaultDetailedScores[theme] = structuredClone(defaultQuestionScores);
      } else {
          // Manual deep copy as fallback
          defaultDetailedScores[theme] = JSON.parse(JSON.stringify(defaultQuestionScores));
      }
  });
  return defaultDetailedScores;
}

// Helper to create default theme scores (calculated from defaults)
function createDefaultThemeScores(): ThemeScores {
     const defaultScores = {} as ThemeScores;
     themeOrder.forEach(theme => {
         defaultScores[theme] = 0; // Default overall score to 0
     });
     return defaultScores;
}


/**
 * Retrieves all stored mood data from local storage.
 * Handles potential errors during parsing.
 * @returns The stored data object or an empty object if no data or error.
 */
export function getAllEntries(): StoredData {
  if (typeof window === 'undefined') {
    return {}; // Return empty object on server side
  }
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    const parsedData = rawData ? JSON.parse(rawData) : {};

    // --- Data Migration/Validation ---
    // Ensure each entry has the new detailedScores structure
    Object.keys(parsedData).forEach(date => {
        if (!parsedData[date].detailedScores) {
            console.warn(`Migrating data for ${date}: Adding default detailedScores.`);
            parsedData[date].detailedScores = createDefaultDetailedScores();
            // Recalculate overall scores if they seem outdated (optional but good practice)
            // parsedData[date].scores = calculateOverallScores(parsedData[date].detailedScores);
        } else {
             // Ensure all themes and questions exist within detailedScores
             themeOrder.forEach(theme => {
                 if (!parsedData[date].detailedScores[theme]) {
                     parsedData[date].detailedScores[theme] = {}; // Initialize theme if missing
                 }
                 for (let i = 0; i < 8; i++) {
                     if (parsedData[date].detailedScores[theme][i] === undefined) {
                         parsedData[date].detailedScores[theme][i] = 0; // Default missing question
                     }
                 }
             });
        }
         // Ensure overall scores structure exists
         if (!parsedData[date].scores) {
            parsedData[date].scores = createDefaultThemeScores();
         } else {
              themeOrder.forEach(theme => {
                  if (parsedData[date].scores[theme] === undefined) {
                     parsedData[date].scores[theme] = 0; // Default missing overall score
                  }
              });
         }
         // Ensure mood exists
         if (parsedData[date].mood === undefined) {
             parsedData[date].mood = null;
         }
    });


    return parsedData;
  } catch (error) {
    console.error("Error reading or parsing data from local storage:", error);
     // Attempt to clear corrupted data? Or return empty? Returning empty for now.
     // localStorage.removeItem(STORAGE_KEY);
    return {};
  }
}

/**
 * Retrieves the entry for a specific date from local storage.
 * Initializes with defaults if not found or incomplete.
 * @param date - The date string in YYYY-MM-DD format.
 * @returns The DailyEntry for the date.
 */
export function getDailyEntry(date: string): DailyEntry {
  const allData = getAllEntries();
  const defaultDetailedScores = createDefaultDetailedScores();
  const defaultScores = createDefaultThemeScores();

  const entry = allData[date];

  if (entry) {
     // Ensure the retrieved entry has all necessary parts, merging defaults if needed
      const detailedScores = { ...defaultDetailedScores, ...(entry.detailedScores || {}) };
      // Deep merge for each theme's questions
      themeOrder.forEach(theme => {
          detailedScores[theme] = { ...(defaultDetailedScores[theme] || {}), ...(entry.detailedScores?.[theme] || {}) };
           for (let i = 0; i < 8; i++) {
                if (detailedScores[theme][i] === undefined) {
                    detailedScores[theme][i] = 0;
                }
            }
      });

      const scores = { ...defaultScores, ...(entry.scores || {}) };
       themeOrder.forEach(theme => {
           if (scores[theme] === undefined) {
               scores[theme] = 0;
           }
       });


      return {
          date: entry.date || date,
          mood: entry.mood !== undefined ? entry.mood : null,
          scores: scores,
          detailedScores: detailedScores,
      };
  } else {
      // Return a completely new default entry
      return {
          date,
          mood: null,
          scores: defaultScores,
          detailedScores: defaultDetailedScores,
      };
  }
}


/**
 * Saves the entire daily entry (mood, calculated scores, and detailed scores) for a specific date
 * to LocalStorage and attempts to save to Firebase Firestore.
 * Ensures the entry structure is complete before saving.
 * @param entry - The DailyEntry object.
 */
export async function saveDailyEntry(entry: DailyEntry): Promise<void> { // Make function async
   if (typeof window === 'undefined' || !entry || !entry.date) return;
  
  // Prepare complete entry data (already done in your existing logic)
  const defaultDetailedScores = createDefaultDetailedScores();
  const defaultScores = createDefaultThemeScores();
  const completeDetailedScores = { ...defaultDetailedScores, ...(entry.detailedScores || {}) };
  themeOrder.forEach(theme => {
      completeDetailedScores[theme] = { ...(defaultDetailedScores[theme] || {}), ...(entry.detailedScores?.[theme] || {}) };
       for (let i = 0; i < 8; i++) {
            if (completeDetailedScores[theme][i] === undefined) {
                completeDetailedScores[theme][i] = 0;
            }
        }
  });
  const completeScores = { ...defaultScores, ...(entry.scores || {}) };
  themeOrder.forEach(theme => {
      if (completeScores[theme] === undefined) {
          completeScores[theme] = 0;
      }
  });
  const completeEntry: DailyEntry = {
      date: entry.date,
      mood: entry.mood !== undefined ? entry.mood : null,
      scores: completeScores,
      detailedScores: completeDetailedScores
  };

  // 1. Save to LocalStorage
  try {
    const allData = getAllEntries();
    allData[entry.date] = completeEntry;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
    console.log('[LocalStorage] Entry saved successfully for date:', entry.date);
  } catch (error) {
    console.error("[LocalStorage] Error saving daily entry to local storage:", error);
  }

  // 2. Attempt to save to Firestore
  if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) { // Only attempt if Firebase is likely configured
    try {
      console.log('[Firestore] Attempting to save entry for date:', completeEntry.date);
      const firestoreResult = await saveEntryToFirestore(completeEntry);
      if (!firestoreResult.success) {
        console.error('[Firestore] Failed to save entry to Firestore:', firestoreResult.error);
        // Optionally, inform the user via a non-blocking mechanism if possible (e.g., a global toast context)
        // For now, just logging the error.
      } else {
        console.log('[Firestore] Entry also saved to Firestore with docId:', firestoreResult.docId);
      }
    } catch (error) {
      console.error('[Firestore] Error calling saveEntryToFirestore from saveDailyEntry:', error);
    }
  } else {
      console.warn('[Firestore] Skipping Firestore save as NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set.');
  }
}


// Helper function to calculate overall theme scores from detailed scores
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

