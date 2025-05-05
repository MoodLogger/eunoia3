
"use client"; // This page interacts with localStorage and state, so it needs to be a Client Component

import * as React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MoodSelector } from '@/components/mood-selector';
import { ThemeAssessment } from '@/components/theme-assessment';
import { MoodAnalysis } from '@/components/mood-analysis';
import { saveDailyEntry, getDailyEntry } from '@/lib/storage';
import type { DailyEntry, Mood, ThemeScores } from '@/lib/types';

export default function Home() {
  const [currentDate, setCurrentDate] = React.useState('');
  const [dailyEntry, setDailyEntry] = React.useState<DailyEntry | null>(null);
  const [isClient, setIsClient] = React.useState(false);

  // Effect to run only on the client after mount
  React.useEffect(() => {
    setIsClient(true);
    const today = format(new Date(), 'yyyy-MM-dd');
    setCurrentDate(today);
    // Fetch entry for today, which will include default scores (0) if no entry exists
    const storedEntry = getDailyEntry(today);
    setDailyEntry(storedEntry);
  }, []); // Empty dependency array ensures this runs once on mount

  // Update localStorage whenever dailyEntry changes
  React.useEffect(() => {
    // Only save if dailyEntry is not null and we are on the client
    if (dailyEntry && isClient) {
      saveDailyEntry(dailyEntry);
    }
  }, [dailyEntry, isClient]);

  const handleMoodSelect = (mood: Mood) => {
    setDailyEntry((prevEntry) => {
      // Ensure prevEntry is not null before updating
      if (!prevEntry) return null;
      return { ...prevEntry, mood };
    });
  };

  const handleScoreChange = (theme: keyof ThemeScores, value: number) => {
    setDailyEntry((prevEntry) => {
      // Ensure prevEntry is not null before updating
      if (!prevEntry) return null;
      // Ensure scores object exists before spreading, including the new theme
      // Use the default scores from getDailyEntry as a base if scores are missing
      const defaultScores: ThemeScores = { dreaming: 0, moodScore: 0, training: 0, diet: 0, socialRelations: 0, familyRelations: 0, selfEducation: 0 }; // Added moodScore
      const currentScores = prevEntry.scores || defaultScores;
      return {
        ...prevEntry,
        scores: {
          ...currentScores,
          [theme]: value, // Value comes directly from the slider (-2 to +2)
        },
      };
    });
  };

  // Render loading state or null on server/before hydration
  if (!isClient || !dailyEntry) {
     return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
            <div className="w-full max-w-md space-y-6">
                {/* Skeleton for Mood Logger Card */}
                <Card className="shadow-lg animate-pulse">
                    <CardHeader className="text-center">
                        <div className="h-8 bg-muted rounded w-3/4 mx-auto mb-2"></div>
                        <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                    </CardHeader>
                    <CardContent>
                         <div className="h-10 bg-muted rounded w-full mb-6"></div> {/* Placeholder for MoodSelector */}
                    </CardContent>
                </Card>
                 {/* Skeleton for Theme Assessment Card */}
                 <Card className="shadow-lg animate-pulse">
                     <CardHeader>
                        <div className="h-6 bg-muted rounded w-1/2 mx-auto mb-2"></div>
                    </CardHeader>
                    <CardContent className="space-y-6 p-6">
                         {[...Array(7)].map((_, i) => ( // Updated skeleton count to 7
                           <div key={i} className="space-y-2">
                               <div className="flex justify-between items-center">
                                   <div className="h-4 bg-muted rounded w-1/3"></div>
                                   <div className="h-4 bg-muted rounded w-1/6"></div>
                               </div>
                               <div className="h-2 bg-muted rounded w-full"></div> {/* Slider track */}
                                <div className="h-5 w-5 bg-muted rounded-full -mt-3.5 mx-auto relative z-10"></div> {/* Slider thumb */}
                           </div>
                         ))}
                     </CardContent>
                </Card>
                 {/* Skeleton for Mood Analysis Card */}
                <Card className="shadow-lg animate-pulse">
                     <CardHeader>
                        <div className="h-6 bg-muted rounded w-1/2 mx-auto mb-2"></div>
                        <div className="h-4 bg-muted rounded w-1/3 mx-auto"></div>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center space-y-4 p-6">
                        <div className="h-10 bg-muted rounded w-1/2"></div>
                        <div className="h-10 bg-muted rounded w-1/2"></div>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
  }

  // Render actual content once client-side and data is loaded
  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-primary">Mood Logger</CardTitle>
            <CardDescription>
              {/* Ensure currentDate is valid before formatting */}
              How are you feeling today, {currentDate ? format(new Date(currentDate + 'T00:00:00'), 'MMMM d, yyyy') : '...'}? {/* Added T00:00:00 for robust date parsing */}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MoodSelector
              selectedMood={dailyEntry.mood}
              onMoodSelect={handleMoodSelect}
            />
          </CardContent>
        </Card>

        {/* Pass the scores to ThemeAssessment */}
        <ThemeAssessment
          scores={dailyEntry.scores}
          onScoreChange={handleScoreChange}
        />

        <MoodAnalysis />
      </div>
    </main>
  );
}
