
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
  moodScore: 'Mood Quality / Stability', // Added label for new theme
  training: 'Training / Exercise',
  diet: 'Diet / Nutrition',
  socialRelations: 'Social Relations',
  familyRelations: 'Family Relations',
  selfEducation: 'Self Education / Learning',
};

// Order of themes for display
const themeOrder: Array<keyof ThemeScores> = [
    'dreaming',
    'moodScore', // Added new theme below dreaming
    'training',
    'diet',
    'socialRelations',
    'familyRelations',
    'selfEducation',
];


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
                    {[...Array(themeOrder.length)].map((_, i) => ( // Updated skeleton count based on themeOrder length
                      <div key={i} className="space-y-2">
                          <div className="flex justify-between items-center">
                               <div className="h-4 bg-muted rounded w-1/3"></div>
                               <div className="h-4 bg-muted rounded w-1/6"></div>
                           </div>
                           <div className="h-2 bg-muted rounded w-full"></div> {/* Slider track */}
                           <div className="h-5 w-5 bg-muted rounded-full -mt-3.5 mx-auto relative z-10"></div> {/* Slider thumb */}
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
        {/* Ensure scores are available before mapping */}
        {scores && themeOrder.map((theme) => (
          <div key={theme} className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor={theme} className="text-foreground/80">{themeLabels[theme]}</Label>
              {/* Display score with + sign if positive */}
              {/* Check if scores[theme] is defined before accessing */}
              <span className="text-sm font-medium text-primary">
                 {scores[theme] !== undefined ? (scores[theme] > 0 ? `+${scores[theme]}` : scores[theme]) : 0}
              </span>
            </div>
            <Slider
              id={theme}
              min={-2}
              max={2}
              step={1}
              // Ensure scores[theme] has a fallback value (e.g., 0) if undefined
              value={[scores[theme] !== undefined ? scores[theme] : 0]}
              onValueChange={([value]) => onScoreChange(theme, value)}
              aria-label={`${themeLabels[theme]} score: ${scores[theme] !== undefined ? scores[theme] : 0}`}
              className="[&>span:first-of-type]:h-2 [&>span:first-of-type>span]:h-2 [&>span:last-of-type]:h-5 [&>span:last-of-type]:w-5" // Standard ShadCN slider sizing
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
