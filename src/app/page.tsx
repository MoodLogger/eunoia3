
"use client"; // This page interacts with localStorage and state, so it needs to be a Client Component

import * as React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ThemeAssessment } from '@/components/theme-assessment';
import { MoodAnalysis } from '@/components/mood-analysis';
import { CalculatedMoodDisplay } from '@/components/calculated-mood-display'; // Import new component
import { saveDailyEntry, getDailyEntry } from '@/lib/storage';
import type { DailyEntry, Mood, ThemeScores } from '@/lib/types';
import type { LucideIcon } from 'lucide-react'; // Import LucideIcon type
import { Frown, Meh, Smile } from 'lucide-react'; // Import icons

// Define types for calculated mood
type CalculatedMoodCategory = 'Bad' | 'Normal' | 'Good' | 'Calculating...';
interface CalculatedMoodState {
    icon: LucideIcon | null;
    label: CalculatedMoodCategory;
}

// Function to calculate mood category and icon based on scores
const calculateMoodFromScores = (scores: ThemeScores | undefined): CalculatedMoodState => {
    if (!scores) {
        return { icon: null, label: 'Calculating...' };
    }

    const themeKeys = Object.keys(scores) as Array<keyof ThemeScores>;
    const sum = themeKeys.reduce((acc, key) => acc + (scores[key] ?? 0), 0);

    // Define score ranges for categories
    // Min score: 7 * -2 = -14
    // Max score: 7 * 2 = 14
    // Ranges: Bad: [-14, -5], Normal: [-4, 4], Good: [5, 14]
    if (sum <= -5) {
        return { icon: Frown, label: 'Bad' };
    } else if (sum >= 5) {
        return { icon: Smile, label: 'Good' };
    } else {
        return { icon: Meh, label: 'Normal' };
    }
};


export default function Home() {
  const [currentDate, setCurrentDate] = React.useState('');
  const [dailyEntry, setDailyEntry] = React.useState<DailyEntry | null>(null);
  const [calculatedMood, setCalculatedMood] = React.useState<CalculatedMoodState>({ icon: null, label: 'Calculating...' });
  const [isClient, setIsClient] = React.useState(false);

  // Effect to run only on the client after mount
  React.useEffect(() => {
    setIsClient(true);
    const today = format(new Date(), 'yyyy-MM-dd');
    setCurrentDate(today);
    const storedEntry = getDailyEntry(today);
    setDailyEntry(storedEntry);
    // Initial calculation of mood based on stored/default scores
    setCalculatedMood(calculateMoodFromScores(storedEntry.scores));
  }, []);

  // Update localStorage and recalculate mood whenever dailyEntry changes
  React.useEffect(() => {
    if (dailyEntry && isClient) {
      saveDailyEntry(dailyEntry);
      // Recalculate mood whenever scores change
      setCalculatedMood(calculateMoodFromScores(dailyEntry.scores));
    }
  }, [dailyEntry, isClient]);


  const handleScoreChange = (theme: keyof ThemeScores, value: number) => {
    setDailyEntry((prevEntry) => {
      if (!prevEntry) return null;
      const defaultScores: ThemeScores = { dreaming: 0, moodScore: 0, training: 0, diet: 0, socialRelations: 0, familyRelations: 0, selfEducation: 0 };
      const currentScores = prevEntry.scores || defaultScores;
      return {
        ...prevEntry,
        scores: {
          ...currentScores,
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
                {/* Skeleton for Mood Logger Card */}
                <Card className="shadow-lg animate-pulse">
                    <CardHeader className="text-center">
                        <div className="h-8 bg-muted rounded w-3/4 mx-auto mb-2"></div>
                        <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                    </CardHeader>
                    <CardContent>
                         <div className="h-16 w-16 bg-muted rounded-full mx-auto mb-2"></div> {/* Placeholder for CalculatedMoodDisplay Icon */}
                         <div className="h-4 bg-muted rounded w-1/4 mx-auto"></div> {/* Placeholder for CalculatedMoodDisplay Label */}
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
              Overall assessment for {currentDate ? format(new Date(currentDate + 'T00:00:00'), 'MMMM d, yyyy') : '...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Use CalculatedMoodDisplay instead of MoodSelector */}
             <CalculatedMoodDisplay
                 icon={calculatedMood.icon}
                 label={calculatedMood.label}
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
