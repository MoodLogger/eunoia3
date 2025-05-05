
export type Mood = 'happy' | 'sad' | 'neutral' | 'angry' | null;

export interface ThemeScores {
  dreaming: number;
  training: number;
  diet: number;
  socialRelations: number;
  familyRelations: number; // Added new theme
  selfEducation: number;
}

export interface DailyEntry {
  date: string; // YYYY-MM-DD format
  mood: Mood;
  scores: ThemeScores;
}

export interface StoredData {
  [date: string]: DailyEntry;
}
