"use client";

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { ThemeQuestionScores, QuestionScore, ThemeScores } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ThemeQuestionsFormProps {
  themeKey: keyof ThemeScores;
  themeLabel: string;
  detailedScores: ThemeQuestionScores;
  onQuestionScoreChange: (themeKey: keyof ThemeScores, questionIndex: number, value: QuestionScore) => void;
}

// Map theme keys to labels if needed, or use themeLabel prop
const themeLabelMap: Partial<Record<keyof ThemeScores, string>> = {
    dreaming: 'Sen',
    moodScore: 'Nastawienie',
    training: 'Fitness',
    diet: 'Odżywianie',
    socialRelations: 'Relacje zewnętrzne',
    familyRelations: 'Relacje rodzinne',
    selfEducation: 'Rozwój intelektualny', // Updated label
};


// Function to get questions, now handles specific question for 'diet' and 'dreaming' theme
const getQuestionsForTheme = (themeKey: keyof ThemeScores): string[] => {
  const questions: string[] = [];
  const label = themeLabelMap[themeKey] || themeKey; // Get the friendly label

  for (let i = 0; i < 8; i++) {
      if (themeKey === 'diet' && i === 0) {
          questions.push("Nawodnienie"); // Specific first question for Diet
      } else if (themeKey === 'dreaming' && i === 0) {
          questions.push("O której położyłeś się do łóżka?"); // Specific first question for Sen
      } else if (themeKey === 'dreaming' && i === 1) {
          questions.push("Jak szybko usnąłeś?"); // Specific second question for Sen
      } else if (themeKey === 'dreaming' && i === 2) {
          questions.push("O której się obudziłeś?"); // Specific third question for Sen
      } else if (themeKey === 'dreaming' && i === 3) {
          questions.push("Czy był potrzebny budzik?"); // Specific fourth question for Sen
      } else if (themeKey === 'dreaming' && i === 4) {
          questions.push("Czy budziłeś się w nocy?"); // Specific fifth question for Sen
      } else if (themeKey === 'dreaming' && i === 5) {
          questions.push("Czy czułeś się wyspany?"); // Specific sixth question for Sen
      }
      else {
          questions.push(`Placeholder Question ${i + 1} for ${label}?`); // Default placeholders
      }
  }
  return questions;
};


export function ThemeQuestionsForm({
  themeKey,
  themeLabel, // Use the passed label
  detailedScores,
  onQuestionScoreChange
}: ThemeQuestionsFormProps) {

  const questions = getQuestionsForTheme(themeKey);

  const handleValueChange = (questionIndex: number, value: string) => {
    const score = parseFloat(value) as QuestionScore;
    if ([-0.25, 0, 0.25].includes(score)) {
      onQuestionScoreChange(themeKey, questionIndex, score);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-center text-primary">
        {themeKey === 'dreaming' ? "Pytania na temat snu" : `${themeLabel} Questions`}
      </h3>
      {questions.map((question, index) => {
        const isDietQuestion1 = themeKey === 'diet' && index === 0;
        const isDreamingQuestion1 = themeKey === 'dreaming' && index === 0;
        const isDreamingQuestion2 = themeKey === 'dreaming' && index === 1;
        const isDreamingQuestion3 = themeKey === 'dreaming' && index === 2;
        const isDreamingQuestion4 = themeKey === 'dreaming' && index === 3;
        const isDreamingQuestion5 = themeKey === 'dreaming' && index === 4;

        const defaultNegativeLabel = "Negative (-0.25)";
        const defaultNeutralLabel = "Neutral (0)";
        const defaultPositiveLabel = "Positive (+0.25)";

        let negativeLabel = defaultNegativeLabel;
        let neutralLabel = defaultNeutralLabel;
        let positiveLabel = defaultPositiveLabel;

        if (isDietQuestion1) {
            negativeLabel = "<1 litr (-0.25)";
            neutralLabel = "1-2 litry (0)";
            positiveLabel = ">2 litry (+0.25)";
        } else if (isDreamingQuestion1) {
            negativeLabel = "po g. 23 (-0.25)";
            neutralLabel = "między g. 22 a 23 (0)";
            positiveLabel = "przed g. 22 (+0.25)";
        } else if (isDreamingQuestion2) {
            negativeLabel = "Ponad godzinę (-0.25)";
            neutralLabel = "ok. pół godziny (0)";
            positiveLabel = "ok. kwadrans (+0.25)";
        } else if (isDreamingQuestion3) {
            negativeLabel = "po g. 7 (-0.25)";
            neutralLabel = "ok. 6:30 (0)"; 
            positiveLabel = "ok. g. 6 (+0.25)";
        } else if (isDreamingQuestion4) {
            negativeLabel = "Musiał dzwonić kilka razy (-0.25)";
            neutralLabel = "Wstałem po jednym dzwonku (0)";
            positiveLabel = "Wstałem przed budzikiem (+0.25)";
        } else if (isDreamingQuestion5) {
            negativeLabel = "tak i miałem problem z ponownym zaśnięciem (-0.25)";
            neutralLabel = "tak, na krótko (0)";
            positiveLabel = "nie (+0.25)"; // Updated "Positive" label for this question
        }


        return (
          <div key={`${themeKey}-${index}`} className="space-y-3 p-4 border rounded-md bg-card shadow-sm">
            <Label htmlFor={`${themeKey}-q${index}`} className="text-sm font-medium text-foreground/90 block mb-2">
              {index + 1}. {question}
            </Label>
            <RadioGroup
              id={`${themeKey}-q${index}`}
              // Ensure value is a string for RadioGroup, default to '0' if undefined
              value={(detailedScores[index]?.toString()) ?? '0'}
              onValueChange={(value) => handleValueChange(index, value)}
              className="flex space-x-4 justify-center"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="-0.25" id={`${themeKey}-q${index}-neg`} />
                <Label htmlFor={`${themeKey}-q${index}-neg`} className="text-xs text-muted-foreground">{negativeLabel}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="0" id={`${themeKey}-q${index}-neu`} />
                <Label htmlFor={`${themeKey}-q${index}-neu`} className="text-xs text-muted-foreground">{neutralLabel}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="0.25" id={`${themeKey}-q${index}-pos`} />
                <Label htmlFor={`${themeKey}-q${index}-pos`} className="text-xs text-muted-foreground">{positiveLabel}</Label>
              </div>
            </RadioGroup>
             {/* Optional: Display current score for the question */}
             {/* <p className="text-xs text-center text-muted-foreground mt-1">Score: {detailedScores[index] ?? 0}</p> */}
          </div>
        );
      })}
    </div>
  );
}
