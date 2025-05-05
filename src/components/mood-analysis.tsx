
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Lightbulb, FileText } from 'lucide-react';
import { analyzeMoodPatterns } from '@/ai/flows/analyze-mood-patterns';
import type { StoredData } from '@/lib/types'; // Removed unused DailyEntry import
import { getAllEntries } from '@/lib/storage';
import { format } from 'date-fns';

// Helper function to convert data for AI
function prepareDataForAnalysis(allEntries: StoredData): { moodData: string; themeScores: string } {
    const entriesArray = Object.values(allEntries);

    const moodData = entriesArray.map(entry => ({
        date: entry.date,
        mood: entry.mood || 'not specified' // Handle null moods
    }));

    const themeScores = entriesArray.map(entry => ({
        date: entry.date,
        dreaming: entry.scores.dreaming,
        training: entry.scores.training, // Corrected key from 'trainings'
        diet: entry.scores.diet,
        socialRelations: entry.scores.socialRelations,
        selfEducation: entry.scores.selfEducation
    }));

    return {
        moodData: JSON.stringify(moodData),
        themeScores: JSON.stringify(themeScores)
    };
}

export function MoodAnalysis() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [analysisResult, setAnalysisResult] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true); // Ensure this runs only on the client after hydration
  }, []);


  const handleAnalyzeMoods = async () => {
    if (!isClient) return; // Don't run analysis on server

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const allEntries = getAllEntries();
      const entriesCount = Object.keys(allEntries).length;

      if (entriesCount < 3) { // Require at least 3 entries for meaningful analysis
          setError("Not enough data to analyze. Please log your mood and themes for at least 3 days.");
          setIsLoading(false);
          return;
      }

      const { moodData, themeScores } = prepareDataForAnalysis(allEntries);
      const result = await analyzeMoodPatterns({ moodData, themeScores });
      setAnalysisResult(result.insights);
    } catch (err) {
      console.error("Error analyzing mood patterns:", err);
      setError("Failed to analyze mood patterns. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = () => {
      if (!isClient) return; // Don't run export on server

      try {
          const allEntries = getAllEntries();
          const entriesArray = Object.values(allEntries);

          if (entriesArray.length === 0) {
              setError("No data to export.");
              return;
          }

          // Define CSV headers
          const headers = ['Date', 'Mood', 'Dreaming', 'Training', 'Diet', 'Social Relations', 'Self Education'];
          // Prepare CSV rows
          const rows = entriesArray.map(entry => [
              entry.date,
              entry.mood || '', // Handle null mood
              entry.scores.dreaming,
              entry.scores.training, // Corrected key
              entry.scores.diet,
              entry.scores.socialRelations,
              entry.scores.selfEducation
          ]);

          // Combine headers and rows
          const csvContent = [
              headers.join(','),
              ...rows.map(row => row.join(','))
          ].join('\n');

          // Create a Blob and download link
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement("a");
          const url = URL.createObjectURL(blob);
          link.setAttribute("href", url);
          const formattedDate = format(new Date(), 'yyyyMMdd');
          link.setAttribute("download", `mood_logger_data_${formattedDate}.csv`);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setError(null); // Clear any previous errors

      } catch (err) {
          console.error("Error exporting data:", err);
          setError("Failed to export data. Please try again.");
      }
  };


  if (!isClient) {
    // Render a placeholder or skeleton on the server
    return (
        <Card className="w-full max-w-md mx-auto mt-6 shadow-lg">
            <CardHeader>
                <CardTitle className="text-center flex items-center justify-center"><Lightbulb className="mr-2 h-5 w-5 text-accent" /> Mood Analysis & Export</CardTitle>
                <CardDescription className="text-center">Analyze patterns and export your data.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4 p-6">
                 <div className="animate-pulse h-10 bg-muted rounded w-1/2"></div>
                 <div className="animate-pulse h-10 bg-muted rounded w-1/2"></div>
            </CardContent>
        </Card>
    );
  }


  return (
    <Card className="w-full max-w-md mx-auto mt-6 shadow-lg">
      <CardHeader>
        <CardTitle className="text-center flex items-center justify-center"><Lightbulb className="mr-2 h-5 w-5 text-accent" /> Mood Analysis & Export</CardTitle>
        <CardDescription className="text-center">Analyze patterns in your logged data and export to CSV.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Button onClick={handleAnalyzeMoods} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                 <Lightbulb className="mr-2 h-4 w-4" /> Analyze Moods
                </>
              )}
            </Button>
             <Button onClick={handleExportData} variant="outline">
                 <FileText className="mr-2 h-4 w-4" /> Export Data (CSV)
            </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {analysisResult && !error && (
          <Alert variant="default" className="mt-4 bg-accent/10 border-accent">
            <Lightbulb className="h-4 w-4 text-accent" />
            <AlertTitle className="text-accent-foreground">Analysis Insights</AlertTitle>
            <AlertDescription className="text-accent-foreground/90 whitespace-pre-wrap">
              {analysisResult}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
