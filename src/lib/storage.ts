
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
  const defaultScores: ThemeScores = {
    dreaming: 5, // Default to middle score
    training: 5,
    diet: 5,
    socialRelations: 5,
    selfEducation: 5,
  };
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
    const currentEntry = getDailyEntry(date);
    allData[date] = { ...currentEntry, mood };
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
    const currentEntry = getDailyEntry(date);
    allData[date] = { ...currentEntry, scores };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
  } catch (error) {
    console.error("Error saving scores to local storage:", error);
  }
}

/**
 * Saves the entire daily entry (mood and scores) for a specific date.
 * @param entry - The DailyEntry object.
 */
export function saveDailyEntry(entry: DailyEntry): void {
   if (typeof window === 'undefined') return;
  try {
    const allData = getAllEntries();
    allData[entry.date] = entry;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
  } catch (error) {
    console.error("Error saving daily entry to local storage:", error);
  }
}
