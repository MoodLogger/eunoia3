
import type { DailyEntry, StoredData, ThemeScores, Mood, DetailedThemeScores, ThemeQuestionScores, QuestionScore } from './types';
import { themeOrder } from '@/components/theme-assessment'; // Import themeOrder

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
 * Saves the entire daily entry (mood, calculated scores, and detailed scores) for a specific date.
 * Ensures the entry structure is complete before saving.
 * @param entry - The DailyEntry object.
 */
export function saveDailyEntry(entry: DailyEntry): void {
   if (typeof window === 'undefined' || !entry || !entry.date) return;
  try {
    const allData = getAllEntries(); // Get current data (already validated/migrated)
    const defaultDetailedScores = createDefaultDetailedScores();
    const defaultScores = createDefaultThemeScores();


    // Ensure the entry being saved has all necessary fields, merging defaults
     const completeDetailedScores = { ...defaultDetailedScores, ...(entry.detailedScores || {}) };
      themeOrder.forEach(theme => {
          completeDetailedScores[theme] = { ...(defaultDetailedScores[theme] || {}), ...(entry.detailedScores?.[theme] || {}) };
           for (let i = 0; i < 8; i++) {
                if (completeDetailedScores[theme][i] === undefined) {
                    completeDetailedScores[theme][i] = 0; // Default missing question score
                }
            }
      });

     const completeScores = { ...defaultScores, ...(entry.scores || {}) };
      themeOrder.forEach(theme => {
          if (completeScores[theme] === undefined) {
              completeScores[theme] = 0; // Default missing overall score
          }
      });


    const completeEntry: DailyEntry = {
        date: entry.date,
        mood: entry.mood !== undefined ? entry.mood : null,
        scores: completeScores,
        detailedScores: completeDetailedScores
    };

    allData[entry.date] = completeEntry;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
  } catch (error) {
    console.error("Error saving daily entry to local storage:", error);
     // Consider notifying the user about the save failure
  }
}

// --- Removed saveMood and saveScores as saveDailyEntry handles the whole object ---
// If granular saving is needed later, these can be re-added, ensuring they
// correctly fetch the full entry, update the specific part, and save the full entry back.

// Helper function to calculate overall theme scores from detailed scores
// This can be used in page.tsx or here if needed for migration/consistency checks
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
        // Clamp the score between -2 and +2 (although sum should naturally fall in this range)
        overallScores[theme] = Math.max(-2, Math.min(2, sum));
    });
    return overallScores;
}
