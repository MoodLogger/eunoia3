
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Lightbulb, UploadCloud, AlertCircle } from 'lucide-react'; // Added UploadCloud, AlertCircle
import { analyzeMoodPatterns } from '@/ai/flows/analyze-mood-patterns';
import { exportToGoogleSheets } from '@/actions/export-to-google-sheets'; // Import the new server action
import type { StoredData } from '@/lib/types';
import { getAllEntries } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast'; // Import useToast
import { themeOrder, themeLabels } from './theme-assessment'; // Import themeOrder and themeLabels


// Helper function to prepare data for AI analysis (using overall scores)
function prepareDataForAnalysis(allEntries: StoredData): { moodData: string; themeScores: string } {
    const entriesArray = Object.values(allEntries).sort((a, b) => a.date.localeCompare(b.date)); // Sort entries by date

    // Extract primary mood
    const moodData = entriesArray.map(entry => ({
        date: entry.date,
        mood: entry.mood || 'not specified' // Handle null/undefined moods
    }));

    // Extract overall theme scores
    const themeScores = entriesArray.map(entry => {
        // Ensure scores object exists and default missing themes to 0
        const scores = entry.scores || {};
        const entryScores: Record<string, number | string> = { date: entry.date };
        themeOrder.forEach(themeKey => {
            entryScores[themeKey] = scores[themeKey] ?? 0;
        });
        return entryScores;
    });

    return {
        moodData: JSON.stringify(moodData),
        themeScores: JSON.stringify(themeScores)
    };
}

// Helper function to prepare data rows for Google Sheets export
function prepareDataForSheetExport(allEntries: StoredData): (string | number | null)[][] {
    const entriesArray = Object.values(allEntries).sort((a, b) => a.date.localeCompare(b.date)); // Sort entries by date

    if (entriesArray.length === 0) {
        return []; // Return empty array if no data
    }

    // --- Prepare Rows ---
    const rows = entriesArray.map(entry => {
        const rowData: (string | number | null)[] = [
            entry.date,
            // Add overall score for each theme in the defined order
        ];
        themeOrder.forEach(themeKey => {
            rowData.push(entry.scores?.[themeKey] ?? 0);
        });
        return rowData;
    });

    return rows;
}

// Define expected header row for Google Sheets
const SHEET_HEADERS = ['Date', ...themeOrder.map(key => themeLabels[key])];

export function MoodAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false); // Separate state for export
  const [analysisResult, setAnalysisResult] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isClient, setIsClient] = React.useState(false);
  const { toast } = useToast(); // Get toast function

  React.useEffect(() => {
    setIsClient(true); // Ensure this runs only on the client after hydration
  }, []);


  const handleAnalyzeMoods = async () => {
    if (!isClient) return; // Don't run analysis on server

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const allEntries = getAllEntries();
      const entriesCount = Object.keys(allEntries).length;

      if (entriesCount < 3) { // Require at least 3 entries for meaningful analysis
          setError("Not enough data to analyze. Please log your assessments for at least 3 days.");
          setIsAnalyzing(false);
          return;
      }

      // Prepare data using only overall scores for the current AI prompt
      const { moodData, themeScores } = prepareDataForAnalysis(allEntries);

      // Call the AI flow
      const result = await analyzeMoodPatterns({ moodData, themeScores });
      setAnalysisResult(result.insights);

    } catch (err) {
      console.error("Error analyzing mood patterns:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to analyze mood patterns. Please try again later.";
      setError(errorMessage);
      toast({ // Show error toast
        variant: "destructive",
        title: "Analysis Failed",
        description: errorMessage,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportData = async () => {
      if (!isClient) return;

      setIsExporting(true);
      setError(null); // Clear previous errors

      try {
          const allEntries = getAllEntries();
          const dataRows = prepareDataForSheetExport(allEntries);

          if (dataRows.length === 0) {
              setError("No data available to export.");
               toast({
                  variant: "destructive",
                  title: "Export Failed",
                  description: "No data available to export.",
              });
              setIsExporting(false);
              return;
          }

          // Call the server action
          const result = await exportToGoogleSheets({ headers: SHEET_HEADERS, data: dataRows });

          if (result.success) {
              toast({
                  title: "Export Successful",
                  description: `Data successfully exported to Google Sheet. ${result.rowsAppended} rows added.`,
              });
              console.log("Export successful:", result);
          } else {
              throw new Error(result.error || "Unknown error during export.");
          }

      } catch (err) {
          console.error("Error exporting data to Google Sheets:", err);
          const errorMessage = err instanceof Error ? err.message : "Failed to export data. Check console for details.";
          setError(errorMessage);
          toast({ // Show error toast
              variant: "destructive",
              title: "Export Failed",
              description: errorMessage,
          });
      } finally {
          setIsExporting(false);
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
        <CardDescription className="text-center">Analyze overall patterns and export data to Google Sheets.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Button onClick={handleAnalyzeMoods} disabled={isAnalyzing || isExporting}>
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                 <Lightbulb className="mr-2 h-4 w-4" /> Analyze Moods
                </>
              )}
            </Button>
             {/* Updated Export Button */}
             <Button onClick={handleExportData} disabled={isAnalyzing || isExporting} variant="outline">
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Exporting...
                </>
              ) : (
                <>
                 <UploadCloud className="mr-2 h-4 w-4" /> Export to Sheets
                </>
              )}
            </Button>
        </div>

        {/* General Error Display (optional, as toasts are primary feedback now) */}
        {error && !isAnalyzing && !isExporting && ( // Only show if not loading
            <Alert variant="destructive" className="mt-4">
                 <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Occurred</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {analysisResult && !error && !isAnalyzing && ( // Only show if not loading and no error
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
