
"use client";

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import type { ThemeScores } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ThemeAssessmentProps {
  scores: ThemeScores;
  onScoreChange: (theme: keyof ThemeScores, value: number) => void;
}

const themeLabels: Record<keyof ThemeScores, string> = {
  dreaming: 'Dreaming / Sleep Quality',
  training: 'Training / Exercise',
  diet: 'Diet / Nutrition',
  socialRelations: 'Social Relations',
  familyRelations: 'Family Relations', // Added label for new theme
  selfEducation: 'Self Education / Learning',
};

export function ThemeAssessment({ scores, onScoreChange }: ThemeAssessmentProps) {
    const [isClient, setIsClient] = React.useState(false);

    React.useEffect(() => {
      setIsClient(true); // Ensure this runs only on the client after hydration
    }, []);

    if (!isClient) {
      // Render placeholder or nothing on server
      return (
        <Card className="w-full max-w-md mx-auto mt-6 shadow-lg">
            <CardHeader>
                <CardTitle className="text-center">Daily Theme Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
                <div className="animate-pulse space-y-6">
                    {[...Array(6)].map((_, i) => ( // Updated skeleton count to 6
                      <div key={i} className="space-y-2">
                          <div className="flex justify-between items-center">
                               <div className="h-4 bg-muted rounded w-1/3"></div>
                               <div className="h-4 bg-muted rounded w-1/6"></div>
                           </div>
                           <div className="h-2 bg-muted rounded w-full"></div> {/* Slider track */}
                           <div className="h-5 w-5 bg-muted rounded-full -mt-3.5 mx-auto"></div> {/* Slider thumb */}
                      </div>
                    ))}
                </div>
            </CardContent>
        </Card>
      );
    }


  return (
    <Card className="w-full max-w-md mx-auto mt-6 shadow-lg">
      <CardHeader>
        <CardTitle className="text-center">Daily Theme Assessment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {(Object.keys(scores) as Array<keyof ThemeScores>).map((theme) => (
          <div key={theme} className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor={theme} className="text-foreground/80">{themeLabels[theme]}</Label>
              {/* Display score with + sign if positive */}
              <span className="text-sm font-medium text-primary">{scores[theme] > 0 ? `+${scores[theme]}` : scores[theme]}</span>
            </div>
            <Slider
              id={theme}
              min={-2} // Ensure min value is -2
              max={2}  // Ensure max value is 2
              step={1}
              value={[scores[theme]]}
              onValueChange={([value]) => onScoreChange(theme, value)}
              aria-label={`${themeLabels[theme]} score: ${scores[theme]}`}
              className="[&>span:first-of-type]:h-2 [&>span:first-of-type>span]:h-2 [&>span:last-of-type]:h-5 [&>span:last-of-type]:w-5" // Standard ShadCN slider sizing
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

