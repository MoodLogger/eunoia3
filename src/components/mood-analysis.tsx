
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Lightbulb, UploadCloud, AlertCircle } from 'lucide-react';
import { analyzeMoodPatterns } from '@/ai/flows/analyze-mood-patterns';
import { exportToGoogleSheets } from '@/actions/export-to-google-sheets';
import type { StoredData, DailyEntry } from '@/lib/types'; // Added DailyEntry
import { getAllEntries } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { themeOrder, themeLabels } from '@/components/theme-assessment';
import { useAuth } from '@/contexts/auth-context'; // Import useAuth

function prepareDataForAnalysis(allEntries: StoredData): { moodData: string; themeScores: string } {
    const entriesArray = Object.values(allEntries).sort((a, b) => a.date.localeCompare(b.date));
    const moodData = entriesArray.map(entry => ({
        date: entry.date,
        mood: entry.mood || 'not specified'
    }));
    const themeScores = entriesArray.map(entry => {
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

function prepareDataForSheetExport(allEntries: StoredData): (string | number | null)[][] {
    const entriesArray = Object.values(allEntries).sort((a, b) => a.date.localeCompare(b.date));
    if (entriesArray.length === 0) return [];
    return entriesArray.map(entry => {
        const rowData: (string | number | null)[] = [entry.date];
        themeOrder.forEach(themeKey => {
            rowData.push(entry.scores?.[themeKey] ?? 0);
        });
        return rowData;
    });
}

const SHEET_HEADERS = ['Date', ...themeOrder.map(key => themeLabels[key])];

export function MoodAnalysis() {
  const { currentUser } = useAuth(); // Get current user
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [analysisResult, setAnalysisResult] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isClient, setIsClient] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchDataForUser = async () => {
    if (!isClient) return {};
    // Pass currentUser.uid if available
    return await getAllEntries(currentUser?.uid);
  };

  const handleAnalyzeMoods = async () => {
    if (!isClient) return;
    if (!currentUser) {
        toast({ variant: "destructive", title: "Authentication Required", description: "Please login to analyze your mood patterns." });
        return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const allEntries = await fetchDataForUser();
      const entriesCount = Object.keys(allEntries).length;

      if (entriesCount < 3) {
          setError("Not enough data to analyze. Please log your assessments for at least 3 days.");
          setIsAnalyzing(false);
          return;
      }
      const { moodData, themeScores } = prepareDataForAnalysis(allEntries);
      const result = await analyzeMoodPatterns({ moodData, themeScores });
      setAnalysisResult(result.insights);
    } catch (err) {
      console.error("Error analyzing mood patterns:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to analyze mood patterns.";
      setError(errorMessage);
      toast({ variant: "destructive", title: "Analysis Failed", description: errorMessage });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportData = async () => {
      if (!isClient) return;
       if (!currentUser) {
        toast({ variant: "destructive", title: "Authentication Required", description: "Please login to export data." });
        return;
      }

      setIsExporting(true);
      setError(null);

      try {
          const allEntries = await fetchDataForUser();
          const dataRows = prepareDataForSheetExport(allEntries);

          if (dataRows.length === 0) {
              setError("No data available to export.");
               toast({ variant: "destructive", title: "Export Failed", description: "No data available to export." });
              setIsExporting(false);
              return;
          }
          const result = await exportToGoogleSheets({ headers: SHEET_HEADERS, data: dataRows });
          if (result.success) {
              toast({ title: "Export Successful", description: `Data exported. ${result.rowsAppended} rows added.` });
          } else {
              throw new Error(result.error || "Unknown error during export.");
          }
      } catch (err) {
          console.error("Error exporting data:", err);
          const errorMessage = err instanceof Error ? err.message : "Failed to export data.";
          setError(errorMessage);
          toast({ variant: "destructive", title: "Export Failed", description: errorMessage });
      } finally {
          setIsExporting(false);
      }
  };

  if (!isClient) {
    return (
        <Card className="w-full max-w-md mx-auto mt-6 shadow-lg">
            <CardHeader>
                <CardTitle className="text-center flex items-center justify-center"><Lightbulb className="mr-2 h-5 w-5 text-accent" /> Analiza i export</CardTitle>
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
        <CardTitle className="text-center flex items-center justify-center"><Lightbulb className="mr-2 h-5 w-5 text-accent" /> Analiza i export</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Button onClick={handleAnalyzeMoods} disabled={isAnalyzing || isExporting || !currentUser}>
              {isAnalyzing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : <><Lightbulb className="mr-2 h-4 w-4" /> Analyze Moods</>}
            </Button>
             <Button onClick={handleExportData} disabled={isAnalyzing || isExporting || !currentUser} variant="outline">
              {isExporting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Exporting...</> : <><UploadCloud className="mr-2 h-4 w-4" /> Export to Sheets</>}
            </Button>
        </div>
        {!currentUser && (
             <Alert variant="default" className="mt-4 bg-primary/10 border-primary/50">
                <AlertCircle className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary-foreground">Login to Enable Features</AlertTitle>
                <AlertDescription className="text-primary-foreground/90">
                    Please <Link href="/login" className="font-semibold hover:underline">login</Link> or <Link href="/register" className="font-semibold hover:underline">register</Link> to analyze mood patterns and export your data.
                </AlertDescription>
            </Alert>
        )}
        {error && !isAnalyzing && !isExporting && (
            <Alert variant="destructive" className="mt-4">
                 <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Occurred</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        {analysisResult && !error && !isAnalyzing && (
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
