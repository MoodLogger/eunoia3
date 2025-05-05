
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Lightbulb, FileText } from 'lucide-react';
import { analyzeMoodPatterns } from '@/ai/flows/analyze-mood-patterns';
import type { StoredData, DailyEntry } from '@/lib/types'; // Import DailyEntry
import { getAllEntries } from '@/lib/storage';
import { format } from 'date-fns';

// Helper function to prepare data for AI analysis (using overall scores)
function prepareDataForAnalysis(allEntries: StoredData): { moodData: string; themeScores: string } {
    const entriesArray = Object.values(allEntries);

    // Extract primary mood
    const moodData = entriesArray.map(entry => ({
        date: entry.date,
        mood: entry.mood || 'not specified' // Handle null/undefined moods
    }));

    // Extract overall theme scores
    const themeScores = entriesArray.map(entry => {
        // Ensure scores object exists and default missing themes to 0
        const scores = entry.scores || {};
        return {
            date: entry.date,
            dreaming: scores.dreaming ?? 0,
            moodScore: scores.moodScore ?? 0,
            training: scores.training ?? 0,
            diet: scores.diet ?? 0,
            socialRelations: scores.socialRelations ?? 0,
            familyRelations: scores.familyRelations ?? 0,
            selfEducation: scores.selfEducation ?? 0
        };
    });

    return {
        moodData: JSON.stringify(moodData),
        themeScores: JSON.stringify(themeScores)
    };
}

// Helper function to prepare data for CSV export (using detailed scores)
function prepareDataForExport(allEntries: StoredData): string {
    const entriesArray = Object.values(allEntries);

    if (entriesArray.length === 0) {
        return ''; // Return empty string if no data
    }

    // --- Define CSV Headers ---
    const baseHeaders = ['Date', 'PrimaryMood'];
    const themeHeaders: string[] = [];
    const themeKeys: Array<keyof DailyEntry['detailedScores']> = Object.keys(
        entriesArray[0]?.detailedScores || {} // Get themes from the first entry's detailed scores
    ) as Array<keyof DailyEntry['detailedScores']>;

    themeKeys.forEach(themeKey => {
         // Header for the overall score
         themeHeaders.push(`${themeKey}_OverallScore`);
        // Headers for each question within the theme
        for (let i = 1; i <= 8; i++) {
            themeHeaders.push(`${themeKey}_Q${i}_Score`);
        }
    });

    const headers = [...baseHeaders, ...themeHeaders];

    // --- Prepare CSV Rows ---
    const rows = entriesArray.map(entry => {
        const rowData: (string | number | null)[] = [
            entry.date,
            entry.mood || '', // Handle null/undefined mood
        ];

        themeKeys.forEach(themeKey => {
            // Add overall score for the theme
             rowData.push(entry.scores?.[themeKey] ?? 0);
             // Add detailed scores for each question
            for (let i = 0; i < 8; i++) {
                 // Access detailed score using the index, provide default 0
                 const detailedScore = entry.detailedScores?.[themeKey]?.[i];
                 rowData.push(detailedScore !== undefined ? detailedScore : 0);
            }
        });
        return rowData.join(','); // Join row data into a CSV string
    });

    // Combine headers and rows
    return [
        headers.join(','), // Header row
        ...rows // Data rows
    ].join('\n'); // Join all lines with newline character
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
          setError("Not enough data to analyze. Please log your assessments for at least 3 days.");
          setIsLoading(false);
          return;
      }

      // Prepare data using only overall scores for the current AI prompt
      const { moodData, themeScores } = prepareDataForAnalysis(allEntries);

      // Call the AI flow
      const result = await analyzeMoodPatterns({ moodData, themeScores });
      setAnalysisResult(result.insights);

    } catch (err) {
      console.error("Error analyzing mood patterns:", err);
      setError(err instanceof Error ? err.message : "Failed to analyze mood patterns. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = () => {
      if (!isClient) return; // Don't run export on server

      try {
          const allEntries = getAllEntries();
          const csvContent = prepareDataForExport(allEntries); // Use the detailed export function

          if (!csvContent) {
              setError("No data to export.");
              return;
          }

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
          URL.revokeObjectURL(url); // Clean up the object URL
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
        <CardDescription className="text-center">Analyze overall patterns in your data and export detailed entries to CSV.</CardDescription>
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
