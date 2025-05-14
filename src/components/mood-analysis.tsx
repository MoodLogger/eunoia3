
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Removed CardDescription
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Lightbulb, UploadCloud, AlertCircle } from 'lucide-react';
import { analyzeMoodPatterns } from '@/ai/flows/analyze-mood-patterns';
import { exportToGoogleSheets } from '@/actions/export-to-google-sheets';
import type { StoredData } from '@/lib/types';
import { getAllEntries } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { themeOrder, themeLabels } from '@/components/theme-assessment';
// Removed useAuth and Link

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
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [analysisResult, setAnalysisResult] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isClient, setIsClient] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchDataForUser = async () => { // Renamed from fetchDataForUser to reflect anonymous usage
    if (!isClient) return {};
    return await getAllEntries(); // No userId
  };

  const handleAnalyzeMoods = async () => {
    if (!isClient) return;
    
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const allEntries = await fetchDataForUser();
      const entriesCount = Object.keys(allEntries).length;

      if (entriesCount < 3) {
          setError("Za mało danych do analizy. Proszę logować swoje oceny przez co najmniej 3 dni."); // Hardcoded Polish
          setIsAnalyzing(false);
          return;
      }
      const { moodData, themeScores } = prepareDataForAnalysis(allEntries);
      const result = await analyzeMoodPatterns({ moodData, themeScores });
      setAnalysisResult(result.insights);
    } catch (err) {
      console.error("Error analyzing mood patterns:", err);
      const errorMessage = err instanceof Error ? err.message : "Analiza nie powiodła się."; // Hardcoded Polish
      setError(errorMessage);
      toast({ variant: "destructive", title: "Analiza nie powiodła się", description: errorMessage }); // Hardcoded Polish
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportData = async () => {
      if (!isClient) return;
      
      setIsExporting(true);
      setError(null);

      try {
          const allEntries = await fetchDataForUser();
          const dataRows = prepareDataForSheetExport(allEntries);

          if (dataRows.length === 0) {
              setError("Brak danych do wyeksportowania."); // Hardcoded Polish
               toast({ variant: "destructive", title: "Export nie powiódł się", description: "Brak danych do wyeksportowania." }); // Hardcoded Polish
              setIsExporting(false);
              return;
          }
          const result = await exportToGoogleSheets({ headers: SHEET_HEADERS, data: dataRows });
          if (result.success) {
              toast({ title: "Export udany", description: `Dane wyeksportowane. ${result.rowsAppended} wierszy dodanych.` }); // Hardcoded Polish
          } else {
              throw new Error(result.error || "Nieznany błąd podczas exportu."); // Hardcoded Polish
          }
      } catch (err) {
          console.error("Error exporting data:", err);
          const errorMessage = err instanceof Error ? err.message : "Export nie powiódł się."; // Hardcoded Polish
          setError(errorMessage);
          toast({ variant: "destructive", title: "Export nie powiódł się", description: errorMessage }); // Hardcoded Polish
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
        {/* Removed CardDescription */}
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Button onClick={handleAnalyzeMoods} disabled={isAnalyzing || isExporting}> {/* Removed !currentUser check */}
              {isAnalyzing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analizuję...</> : <><Lightbulb className="mr-2 h-4 w-4" /> Analizuj nastroje</>}
            </Button>
             <Button onClick={handleExportData} disabled={isAnalyzing || isExporting} variant="outline"> {/* Removed !currentUser check */}
              {isExporting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Exportuję...</> : <><UploadCloud className="mr-2 h-4 w-4" /> Export do Arkuszy</>}
            </Button>
        </div>
        {/* Removed !currentUser Alert */}
        {error && !isAnalyzing && !isExporting && (
            <Alert variant="destructive" className="mt-4">
                 <AlertCircle className="h-4 w-4" />
                <AlertTitle>Wystąpił błąd</AlertTitle> {/* Hardcoded Polish */}
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        {analysisResult && !error && !isAnalyzing && (
          <Alert variant="default" className="mt-4 bg-accent/10 border-accent">
            <Lightbulb className="h-4 w-4 text-accent" />
            <AlertTitle className="text-accent-foreground">Wnioski z analizy</AlertTitle> {/* Hardcoded Polish */}
            <AlertDescription className="text-accent-foreground/90 whitespace-pre-wrap">
              {analysisResult}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
