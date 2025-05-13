
"use client"; // This page interacts with localStorage and state, so it needs to be a Client Component

import * as React from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale'; // Import Polish locale
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ThemeAssessment } from '@/components/theme-assessment';
import { MoodAnalysis } from '@/components/mood-analysis';
import { CalculatedMoodDisplay } from '@/components/calculated-mood-display';
import { saveDailyEntry, getDailyEntry, calculateOverallScores } from '@/lib/storage'; // Import calculateOverallScores
import type { DailyEntry, Mood, ThemeScores, DetailedThemeScores, QuestionScore } from '@/lib/types';
import type { LucideIcon } from 'lucide-react';
import { Frown, Meh, Smile, Loader2, CalendarIcon } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker'; // Import DatePicker
import { Button } from '@/components/ui/button';

type CalculatedMoodCategory = 'Bad' | 'Normal' | 'Good' | 'Calculating...';
interface CalculatedMoodState {
    icon: LucideIcon | null;
    label: CalculatedMoodCategory;
    totalScore: number | null; // Added totalScore
}

// Function to calculate mood category, icon, and total score based on *overall* scores
const calculateMoodFromOverallScores = (scores: ThemeScores | undefined): CalculatedMoodState => {
    if (!scores) {
        return { icon: Loader2, label: 'Calculating...', totalScore: null }; // Use Loader2 icon
    }

    const themeKeys = Object.keys(scores) as Array<keyof ThemeScores>;
    // Calculate sum based on overall scores (-2 to +2)
    const sum = themeKeys.reduce((acc, key) => acc + (scores[key] ?? 0), 0);
     const count = themeKeys.length;
     const average = count > 0 ? sum / count : 0; // Calculate average score


    // Define thresholds based on the average score (range -2 to +2)
     // Example thresholds: Bad <= -0.75, Good >= 0.75, Normal otherwise
     const badThreshold = -0.75;
     const goodThreshold = 0.75;


    if (average <= badThreshold) {
        return { icon: Frown, label: 'Bad', totalScore: parseFloat(sum.toFixed(2)) };
    } else if (average >= goodThreshold) {
        return { icon: Smile, label: 'Good', totalScore: parseFloat(sum.toFixed(2)) };
    } else {
        return { icon: Meh, label: 'Normal', totalScore: parseFloat(sum.toFixed(2)) };
    }
};


export default function Home() {
  const [selectedDate, setSelectedDate] = React.useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [dailyEntry, setDailyEntry] = React.useState<DailyEntry | null>(null);
  const [calculatedMood, setCalculatedMood] = React.useState<CalculatedMoodState>({ icon: Loader2, label: 'Calculating...', totalScore: null }); // Default to calculating
  const [isClient, setIsClient] = React.useState(false);

  // Effect to run only on the client after mount
  React.useEffect(() => {
    setIsClient(true);
    // No need to set selectedDate here anymore as it's initialized above
  }, []);
  
  // Effect to load or initialize entry when selectedDate changes or on initial client mount
  React.useEffect(() => {
    if (isClient && selectedDate) {
        const dateObj = parseISO(selectedDate);
        if (!isValid(dateObj)) {
            console.warn(`Invalid date selected: ${selectedDate}. Defaulting to today.`);
            setSelectedDate(format(new Date(), 'yyyy-MM-dd')); // Reset to today if invalid
            return;
        }
        const storedEntry = getDailyEntry(selectedDate); // Fetches entry with detailed scores for the selected date
        setDailyEntry(storedEntry);
        setCalculatedMood(calculateMoodFromOverallScores(storedEntry.scores));
    }
  }, [isClient, selectedDate]);


  // Update localStorage and potentially Firestore whenever dailyEntry changes
  React.useEffect(() => {
    const performSave = async () => {
      if (dailyEntry && isClient && selectedDate && dailyEntry.date === selectedDate) { // Ensure saving for the correct date
        await saveDailyEntry(dailyEntry); // saveDailyEntry is now async
      }
    };

    performSave();
  }, [dailyEntry, isClient, selectedDate]);


   // Handler for changes in detailed question scores
   const handleQuestionScoreChange = (
       theme: keyof ThemeScores,
       questionIndex: number,
       value: QuestionScore
   ) => {
       setDailyEntry((prevEntry) => {
           if (!prevEntry) return null;

           // Create a deep copy to avoid direct state mutation
           const newDetailedScores = JSON.parse(JSON.stringify(prevEntry.detailedScores)) as DetailedThemeScores;
           if (!newDetailedScores[theme]) {
               newDetailedScores[theme] = {}; // Initialize if theme somehow doesn't exist
           }
            newDetailedScores[theme][questionIndex] = value;


           // Recalculate the overall scores based on the updated detailed scores
           const newOverallScores = calculateOverallScores(newDetailedScores);

           // Recalculate the overall mood display based on the new overall scores
           setCalculatedMood(calculateMoodFromOverallScores(newOverallScores));

           // Return the updated entry
           return {
               ...prevEntry,
               scores: newOverallScores,
               detailedScores: newDetailedScores,
           };
       });
   };

   const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(format(date, 'yyyy-MM-dd'));
    }
  };


  // Render loading state or null on server/before hydration
  if (!isClient || !dailyEntry) {
     return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
            <div className="w-full max-w-md space-y-6">
                {/* Skeleton for Eunoia Card */}
                <Card className="shadow-lg animate-pulse">
                    <CardHeader className="text-center">
                        <div className="h-8 bg-muted rounded w-3/4 mx-auto mb-2"></div>
                        <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-4 space-y-2">
                         <div className="h-16 w-16 bg-muted rounded-full"></div> {/* Placeholder for CalculatedMoodDisplay Icon */}
                         <div className="h-4 bg-muted rounded w-1/4"></div> {/* Placeholder for CalculatedMoodDisplay Label */}
                         <div className="h-4 bg-muted rounded w-1/6 mt-1"></div> {/* Placeholder for Total Score */}
                    </CardContent>
                </Card>
                 {/* Skeleton for Pryzmaty Card */}
                 <Card className="shadow-lg animate-pulse">
                     <CardHeader>
                         <div className="h-6 bg-muted rounded w-1/2 mx-auto mb-2"></div> {/* Changed from "Daily Theme Assessment" */}
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                          {[...Array(7)].map((_, i) => ( // Updated skeleton count to 7
                           <div key={i} className="space-y-2 rounded-md border p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="h-4 bg-muted rounded w-1/3"></div>
                                    <div className="h-4 bg-muted rounded w-1/6"></div>
                                </div>
                                <div className="h-2 bg-muted rounded w-full"></div> {/* Placeholder for overall score/progress */}
                                {/* Skeleton for Accordion Trigger Icon can be omitted or simplified */}
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
            <CardTitle className="text-3xl font-bold text-primary">Eunoia</CardTitle>
            <CardDescription className="flex flex-col items-center space-y-2">
              <span>
                Ogólna ocena z dnia {selectedDate && isValid(parseISO(selectedDate)) ? format(parseISO(selectedDate), 'd MMMM yyyy', { locale: pl }) : '...'}
              </span>
              <DatePicker
                date={selectedDate ? parseISO(selectedDate) : new Date()}
                onDateChange={handleDateChange}
              />
            </CardDescription>
          </CardHeader>
          <CardContent>
             <CalculatedMoodDisplay
                 icon={calculatedMood.icon}
                 label={calculatedMood.label}
                 totalScore={calculatedMood.totalScore}
            />
          </CardContent>
        </Card>

        {/* Pass both overall and detailed scores, and the handler */}
        <ThemeAssessment
          scores={dailyEntry.scores}
          detailedScores={dailyEntry.detailedScores}
          onQuestionScoreChange={handleQuestionScoreChange}
        />

        <MoodAnalysis />
      </div>
    </main>
  );
}

