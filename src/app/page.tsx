
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
    const storedEntry = getDailyEntry(today);
    setDailyEntry(storedEntry);
  }, []); // Empty dependency array ensures this runs once on mount

  // Update localStorage whenever dailyEntry changes
  React.useEffect(() => {
    if (dailyEntry && isClient) {
      saveDailyEntry(dailyEntry);
    }
  }, [dailyEntry, isClient]);

  const handleMoodSelect = (mood: Mood) => {
    setDailyEntry((prevEntry) => {
      if (!prevEntry) return null; // Should not happen if initialized correctly
      return { ...prevEntry, mood };
    });
  };

  const handleScoreChange = (theme: keyof ThemeScores, value: number) => {
    setDailyEntry((prevEntry) => {
      if (!prevEntry) return null;
      return {
        ...prevEntry,
        scores: {
          ...prevEntry.scores,
          [theme]: value,
        },
      };
    });
  };

  // Render loading state or null on server/before hydration
  if (!isClient || !dailyEntry) {
     return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
            <div className="w-full max-w-md space-y-6">
                <Card className="shadow-lg animate-pulse">
                    <CardHeader className="text-center">
                        <div className="h-8 bg-muted rounded w-3/4 mx-auto mb-2"></div>
                        <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                    </CardHeader>
                    <CardContent>
                         <div className="h-10 bg-muted rounded w-full mb-6"></div>
                         <div className="space-y-6 p-6">
                             {[...Array(5)].map((_, i) => (
                               <div key={i} className="space-y-2">
                                   <div className="h-4 bg-muted rounded w-1/3"></div>
                                   <div className="h-6 bg-muted rounded w-full"></div>
                               </div>
                             ))}
                         </div>
                    </CardContent>
                </Card>
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

  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-primary">Mood Logger</CardTitle>
            <CardDescription>
              How are you feeling today, {format(new Date(currentDate), 'MMMM d, yyyy')}?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MoodSelector
              selectedMood={dailyEntry.mood}
              onMoodSelect={handleMoodSelect}
            />
          </CardContent>
        </Card>

        <ThemeAssessment
          scores={dailyEntry.scores}
          onScoreChange={handleScoreChange}
        />

        <MoodAnalysis />
      </div>
    </main>
  );
}

