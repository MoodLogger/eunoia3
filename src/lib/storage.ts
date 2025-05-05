

import type { DailyEntry, StoredData, ThemeScores, Mood } from './types';

const STORAGE_KEY = 'moodLoggerData';

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
    return rawData ? JSON.parse(rawData) : {};
  } catch (error) {
    console.error("Error reading from local storage:", error);
    return {};
  }
}

/**
 * Retrieves the entry for a specific date from local storage.
 * @param date - The date string in YYYY-MM-DD format.
 * @returns The DailyEntry for the date or a default entry if not found.
 */
export function getDailyEntry(date: string): DailyEntry {
  const allData = getAllEntries();
  // Default score is 0, which is the neutral point in the -2 to +2 scale.
  const defaultScores: ThemeScores = {
    dreaming: 0,
    moodScore: 0, // Added default score for new theme
    training: 0,
    diet: 0,
    socialRelations: 0,
    familyRelations: 0,
    selfEducation: 0,
  };
  // Return existing entry or a new one with default scores and null mood
  return allData[date] || { date, mood: null, scores: defaultScores };
}

/**
 * Saves or updates the mood for a specific date in local storage.
 * @param date - The date string in YYYY-MM-DD format.
 * @param mood - The selected mood.
 */
export function saveMood(date: string, mood: Mood): void {
   if (typeof window === 'undefined') return;
  try {
    const allData = getAllEntries();
    const currentEntry = getDailyEntry(date); // Get existing or default entry
    allData[date] = { ...currentEntry, mood }; // Update only the mood
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
  } catch (error) {
    console.error("Error saving mood to local storage:", error);
  }
}

/**
 * Saves or updates the theme scores for a specific date in local storage.
 * @param date - The date string in YYYY-MM-DD format.
 * @param scores - The theme scores object.
 */
export function saveScores(date: string, scores: ThemeScores): void {
   if (typeof window === 'undefined') return;
  try {
    const allData = getAllEntries();
    const currentEntry = getDailyEntry(date); // Get existing or default entry
    // Ensure all themes exist in the scores being saved, adding defaults if needed
    const completeScores: ThemeScores = {
        dreaming: scores.dreaming ?? 0,
        moodScore: scores.moodScore ?? 0, // Ensure moodScore exists
        training: scores.training ?? 0,
        diet: scores.diet ?? 0,
        socialRelations: scores.socialRelations ?? 0,
        familyRelations: scores.familyRelations ?? 0,
        selfEducation: scores.selfEducation ?? 0,
    };
    allData[date] = { ...currentEntry, scores: completeScores }; // Update only the scores
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
  } catch (error) {
    console.error("Error saving scores to local storage:", error);
  }
}

/**
 * Saves the entire daily entry (mood and scores) for a specific date.
 * Ensures the entry structure is complete before saving.
 * @param entry - The DailyEntry object.
 */
export function saveDailyEntry(entry: DailyEntry): void {
   if (typeof window === 'undefined') return;
  try {
    const allData = getAllEntries();
    // Ensure the entry has all necessary fields before saving
    const completeEntry: DailyEntry = {
        date: entry.date,
        mood: entry.mood !== undefined ? entry.mood : null, // Default mood to null if missing
        scores: { // Default scores if missing, including new themes
            dreaming: entry.scores?.dreaming ?? 0,
            moodScore: entry.scores?.moodScore ?? 0, // Add default for moodScore
            training: entry.scores?.training ?? 0,
            diet: entry.scores?.diet ?? 0,
            socialRelations: entry.scores?.socialRelations ?? 0,
            familyRelations: entry.scores?.familyRelations ?? 0,
            selfEducation: entry.scores?.selfEducation ?? 0,
        }
    };
    allData[entry.date] = completeEntry;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
  } catch (error) {
    console.error("Error saving daily entry to local storage:", error);
  }
}
