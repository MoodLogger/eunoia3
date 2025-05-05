
export type Mood = 'happy' | 'sad' | 'neutral' | 'angry' | null;

export interface ThemeScores {
  dreaming: number;
  moodScore: number; // Renamed to avoid conflict with Mood type, representing assessment of mood quality/stability
  training: number;
  diet: number;
  socialRelations: number;
  familyRelations: number;
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
