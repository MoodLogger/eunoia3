
"use client";

import * as React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress'; // Use Progress for visualization
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeQuestionsForm } from './theme-questions-form'; // Import the new form component
import type { ThemeScores, DetailedThemeScores, QuestionScore } from '@/lib/types';
import { ChevronDown } from 'lucide-react'; // Icon for accordion trigger

interface ThemeAssessmentProps {
  scores: ThemeScores;
  detailedScores: DetailedThemeScores; // Add detailed scores prop
  onQuestionScoreChange: (themeKey: keyof ThemeScores, questionIndex: number, value: QuestionScore) => void; // Add handler prop
}

const themeLabels: Record<keyof ThemeScores, string> = {
  dreaming: 'Dreaming / Sleep Quality',
  moodScore: 'Mood Quality / Stability',
  training: 'Training / Exercise',
  diet: 'Diet / Nutrition',
  socialRelations: 'Social Relations',
  familyRelations: 'Family Relations',
  selfEducation: 'Self Education / Learning',
};

// Order of themes for display
export const themeOrder: Array<keyof ThemeScores> = [
    'dreaming',
    'moodScore',
    'training',
    'diet',
    'socialRelations',
    'familyRelations',
    'selfEducation',
];

// Helper to calculate progress bar value (0-100) from score (-2 to +2)
const calculateProgress = (score: number | undefined): number => {
  const numScore = score ?? 0;
  // Map -2 to 0, 0 to 50, +2 to 100
  return ((numScore + 2) / 4) * 100;
};

export function ThemeAssessment({ scores, detailedScores, onQuestionScoreChange }: ThemeAssessmentProps) {
    const [isClient, setIsClient] = React.useState(false);
     const [activeAccordionItem, setActiveAccordionItem] = React.useState<string | null>(null);


    React.useEffect(() => {
      setIsClient(true); // Ensure this runs only on the client after hydration
    }, []);

    if (!isClient) {
      // Render placeholder or skeleton on server
      return (
        <Card className="w-full max-w-md mx-auto mt-6 shadow-lg">
            <CardHeader>
                <CardTitle className="text-center">Daily Theme Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
                <div className="animate-pulse space-y-4">
                    {[...Array(themeOrder.length)].map((_, i) => (
                      <div key={i} className="space-y-2 rounded-md border p-4">
                          <div className="flex justify-between items-center mb-2">
                               <div className="h-4 bg-muted rounded w-1/3"></div>
                               <div className="h-4 bg-muted rounded w-1/6"></div>
                           </div>
                           <div className="h-2 bg-muted rounded w-full"></div> {/* Progress bar placeholder */}
                      </div>
                    ))}
                </div>
            </CardContent>
        </Card>
      );
    }

  // Handle accordion changes
  const handleAccordionChange = (value: string | string[]) => {
      // Assuming single item accordion, value is string or empty array
       setActiveAccordionItem(typeof value === 'string' ? value : (value[0] || null));
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-6 shadow-lg">
      <CardHeader>
        <CardTitle className="text-center">Daily Theme Assessment</CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <Accordion
            type="single"
            collapsible
            className="w-full space-y-4"
            value={activeAccordionItem ?? undefined} // Control the accordion state
             onValueChange={handleAccordionChange} // Update state on change
         >
          {/* Ensure scores are available before mapping */}
          {scores && detailedScores && themeOrder.map((theme) => (
            <AccordionItem value={theme} key={theme} className="border rounded-lg overflow-hidden shadow-sm bg-card">
              <AccordionTrigger className="flex justify-between items-center w-full px-4 py-3 hover:bg-muted/50 transition-colors [&[data-state=open]>svg]:rotate-180">
                <div className="flex-1 text-left">
                  <Label htmlFor={theme} className="text-base font-medium text-foreground/90">{themeLabels[theme]}</Label>
                </div>
                <div className="flex items-center space-x-2">
                     <span className="text-sm font-semibold text-primary w-8 text-right">
                      {/* Display overall score with sign */}
                      {scores[theme] !== undefined ? (scores[theme] > 0 ? `+${scores[theme].toFixed(2)}` : scores[theme].toFixed(2)) : '0.00'}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 text-muted-foreground" />
                </div>
              </AccordionTrigger>
               <AccordionContent className="px-4 pb-4 pt-2 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                  {/* Optional: Show overall progress bar here */}
                   {/* <Progress value={calculateProgress(scores[theme])} className="h-2 mt-1 mb-4" /> */}
                  {/* Render the detailed questions form */}
                   <ThemeQuestionsForm
                       themeKey={theme}
                       themeLabel={themeLabels[theme]}
                       detailedScores={detailedScores[theme]}
                       onQuestionScoreChange={onQuestionScoreChange}
                  />
               </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
