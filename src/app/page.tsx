
"use client";

import * as React from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ThemeAssessment } from '@/components/theme-assessment';
import { MoodAnalysis } from '@/components/mood-analysis';
import { CalculatedMoodDisplay } from '@/components/calculated-mood-display';
import { saveDailyEntry, getDailyEntry, calculateOverallScores, getAllEntries } from '@/lib/storage';
import type { DailyEntry, Mood, ThemeScores, DetailedThemeScores, QuestionScore, StoredData } from '@/lib/types';
import type { LucideIcon } from 'lucide-react';
import { Frown, Meh, Smile, Loader2, AlertCircle } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context'; // Import useAuth
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';

type CalculatedMoodCategory = 'Bad' | 'Normal' | 'Good' | 'Calculating...';
interface CalculatedMoodState {
    icon: LucideIcon | null;
    label: CalculatedMoodCategory;
    totalScore: number | null;
}

const calculateMoodFromOverallScores = (scores: ThemeScores | undefined): CalculatedMoodState => {
    if (!scores) return { icon: Loader2, label: 'Calculating...', totalScore: null };
    const themeKeys = Object.keys(scores) as Array<keyof ThemeScores>;
    const sum = themeKeys.reduce((acc, key) => acc + (scores[key] ?? 0), 0);
    const count = themeKeys.length;
    const average = count > 0 ? sum / count : 0;
    const badThreshold = -0.75;
    const goodThreshold = 0.75;
    if (average <= badThreshold) return { icon: Frown, label: 'Bad', totalScore: parseFloat(sum.toFixed(2)) };
    if (average >= goodThreshold) return { icon: Smile, label: 'Good', totalScore: parseFloat(sum.toFixed(2)) };
    return { icon: Meh, label: 'Normal', totalScore: parseFloat(sum.toFixed(2)) };
};

export default function Home() {
  const { currentUser, loading: authLoading } = useAuth(); // Get currentUser from AuthContext
  const [selectedDate, setSelectedDate] = React.useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [dailyEntry, setDailyEntry] = React.useState<DailyEntry | null>(null);
  const [calculatedMood, setCalculatedMood] = React.useState<CalculatedMoodState>({ icon: Loader2, label: 'Calculating...', totalScore: null });
  const [isClient, setIsClient] = React.useState(false);
  const [isLoadingEntry, setIsLoadingEntry] = React.useState(true);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    if (isClient && !authLoading) { // Only load if client and auth state is resolved
      setIsLoadingEntry(true);
      const dateObj = parseISO(selectedDate);
      if (!isValid(dateObj)) {
        console.warn(`Invalid date selected: ${selectedDate}. Defaulting to today.`);
        setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
        setIsLoadingEntry(false);
        return;
      }
      
      // Pass currentUser.uid if available
      getDailyEntry(selectedDate, currentUser?.uid).then(entry => {
        setDailyEntry(entry);
        setCalculatedMood(calculateMoodFromOverallScores(entry.scores));
        setIsLoadingEntry(false);
      }).catch(err => {
        console.error("Error fetching daily entry:", err);
        setIsLoadingEntry(false);
        // Potentially show an error to the user
      });
    }
  }, [isClient, selectedDate, currentUser, authLoading]); // Add currentUser and authLoading to dependencies

  React.useEffect(() => {
    if (dailyEntry && isClient && selectedDate && dailyEntry.date === selectedDate && !isLoadingEntry && !authLoading) {
      // Pass currentUser.uid if available
      saveDailyEntry(dailyEntry, currentUser?.uid).catch(err => {
        console.error("Error saving daily entry:", err);
        // Potentially show an error to the user
      });
    }
  }, [dailyEntry, isClient, selectedDate, currentUser, isLoadingEntry, authLoading]); // Add isLoadingEntry and authLoading


   const handleQuestionScoreChange = (
       theme: keyof ThemeScores,
       questionIndex: number,
       value: QuestionScore
   ) => {
       setDailyEntry((prevEntry) => {
           if (!prevEntry) return null;
           const newDetailedScores = JSON.parse(JSON.stringify(prevEntry.detailedScores)) as DetailedThemeScores;
           if (!newDetailedScores[theme]) newDetailedScores[theme] = {};
           newDetailedScores[theme][questionIndex] = value;
           const newOverallScores = calculateOverallScores(newDetailedScores);
           setCalculatedMood(calculateMoodFromOverallScores(newOverallScores));
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

  if (authLoading || isLoadingEntry) {
     return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">
            {authLoading ? "Authenticating..." : "Loading Eunoia..."}
          </p>
        </main>
      );
  }
  
  if (!currentUser && isClient) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md text-center shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-primary">Welcome to Eunoia</CardTitle>
            <CardDescription>Your personal mood and well-being tracker.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-muted-foreground">
              Please login or register to save your progress and access personalized insights.
            </p>
            <div className="flex justify-center gap-4">
              <Button asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/register">Register</Link>
              </Button>
            </div>
             <p className="mt-6 text-sm text-muted-foreground">
              Alternatively, you can continue to use the app anonymously. Your data will be stored only in this browser.
            </p>
             <Button variant="link" onClick={() => setDailyEntry(getDailyEntry(selectedDate, undefined).then(setDailyEntry).then(() => setIsLoadingEntry(false)))} className="mt-2">
                Continue Anonymously
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }


  if (!isClient || !dailyEntry) {
     return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
            <div className="w-full max-w-md space-y-6">
                <Card className="shadow-lg animate-pulse">
                    <CardHeader className="text-center">
                        <div className="h-8 bg-muted rounded w-3/4 mx-auto mb-2"></div>
                        <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-4 space-y-2">
                         <div className="h-16 w-16 bg-muted rounded-full"></div>
                         <div className="h-4 bg-muted rounded w-1/4"></div>
                         <div className="h-4 bg-muted rounded w-1/6 mt-1"></div>
                    </CardContent>
                </Card>
                 <Card className="shadow-lg animate-pulse">
                     <CardHeader> <div className="h-6 bg-muted rounded w-1/2 mx-auto mb-2"></div> </CardHeader>
                    <CardContent className="space-y-4 p-6">
                          {[...Array(7)].map((_, i) => (
                           <div key={i} className="space-y-2 rounded-md border p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="h-4 bg-muted rounded w-1/3"></div>
                                    <div className="h-4 bg-muted rounded w-1/6"></div>
                                </div>
                                <div className="h-2 bg-muted rounded w-full"></div>
                           </div>
                         ))}
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
    <main className="flex min-h-screen flex-col items-center p-4 pt-20 bg-background"> {/* Added pt-20 for nav */}
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
