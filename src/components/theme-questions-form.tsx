
"use client";

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { ThemeQuestionScores, QuestionScore, ThemeScores } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input'; // Import Input for editable question

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

// --- State for Editable Questions ---
// We need to manage the text of the editable question (Q8) locally
// Since this component might re-render, we should ideally lift this state up
// or use a context if multiple ThemeQuestionsForm instances need independent Q8 text.
// For simplicity here, we'll use local state, but be aware this might reset
// if the parent component causes a full re-render of this instance without memoization.
// A more robust solution would involve storing the custom question text in the DailyEntry itself.


// Function to get questions, now handles specific questions and the 8th question for 'dreaming'
const getQuestionsForTheme = (themeKey: keyof ThemeScores): string[] => {
  const questions: string[] = [];
  const label = themeLabelMap[themeKey] || themeKey; // Get the friendly label

  for (let i = 0; i < 8; i++) {
      if (themeKey === 'diet' && i === 0) {
          questions.push("Nawodnienie"); // Specific first question for Diet
      } else if (themeKey === 'dreaming' && i === 0) {
          questions.push("O której położyłeś się do łóżka?");
      } else if (themeKey === 'dreaming' && i === 1) {
          questions.push("Jak szybko usnąłeś?");
      } else if (themeKey === 'dreaming' && i === 2) {
          questions.push("O której się obudziłeś?");
      } else if (themeKey === 'dreaming' && i === 3) {
          questions.push("Czy był potrzebny budzik?");
      } else if (themeKey === 'dreaming' && i === 4) {
          questions.push("Czy budziłeś się w nocy?");
      } else if (themeKey === 'dreaming' && i === 5) {
          questions.push("Czy czułeś się wyspany?");
      } else if (themeKey === 'dreaming' && i === 6) {
          questions.push("Jakie miałeś sny?");
      } else if (themeKey === 'dreaming' && i === 7) {
          questions.push("Czy uniknąłeś nadmiernych bodźców przed snem?"); // Specific 8th question for Sen
      } else if (i === 7) { // Handle the 8th question (index 7) for OTHER themes
          // For now, keep a placeholder for other themes, or make it editable too if needed
           questions.push(`Custom Question 8 for ${label}?`); // Placeholder for Q8
      }
      else {
          // Default placeholders for questions 1-7 for themes other than 'diet' and 'dreaming'
          questions.push(`Placeholder Question ${i + 1} for ${label}?`);
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

   // State for the editable question text (Q8 for non-dreaming themes for now)
   // Note: This approach has limitations mentioned above.
   const [customQuestion8Text, setCustomQuestion8Text] = React.useState(
     themeKey !== 'dreaming' ? `Custom Question 8 for ${themeLabel}?` : '' // Initialize only if not dreaming theme
   );
   const [isClient, setIsClient] = React.useState(false);

   React.useEffect(() => {
     setIsClient(true);
     // Re-initialize custom question text if themeKey changes after mount
     if (themeKey !== 'dreaming') {
       setCustomQuestion8Text(`Custom Question 8 for ${themeLabel}?`);
     } else {
       setCustomQuestion8Text(''); // Clear if it becomes dreaming theme
     }
   }, [themeKey, themeLabel]);


   const questions = getQuestionsForTheme(themeKey);


  const handleValueChange = (questionIndex: number, value: string) => {
    const score = parseFloat(value) as QuestionScore;
    if ([-0.25, 0, 0.25].includes(score)) {
      onQuestionScoreChange(themeKey, questionIndex, score);
    }
  };

   // Handler for changing the custom question text
   const handleCustomQuestionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
     setCustomQuestion8Text(event.target.value);
     // Here you might want to also save this custom question text back to your
     // main data store (e.g., in the DailyEntry within localStorage/Firestore)
     // This requires lifting the state or using a callback prop.
   };

   if (!isClient) {
    return <div>Loading questions...</div>; // Or a skeleton loader
  }


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
        const isDreamingQuestion6 = themeKey === 'dreaming' && index === 5;
        const isDreamingQuestion7 = themeKey === 'dreaming' && index === 6;
        const isDreamingQuestion8 = themeKey === 'dreaming' && index === 7; // Identify Sen Q8
        const isEditableQuestion8 = index === 7 && themeKey !== 'dreaming'; // Identify editable Q8 for other themes


        const defaultNegativeLabel = "Negative (-0.25)";
        const defaultNeutralLabel = "Neutral (0)";
        const defaultPositiveLabel = "Positive (+0.25)";

        let negativeLabel = defaultNegativeLabel;
        let neutralLabel = defaultNeutralLabel;
        let positiveLabel = defaultPositiveLabel;

        // Apply specific labels based on theme and question index
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
            positiveLabel = "nie (+0.25)";
        } else if (isDreamingQuestion6) {
            negativeLabel = "Byłem nieprzytomny (-0.25)";
            neutralLabel = "Lekko niedospany (0)";
            positiveLabel = "Tak, pełen energii (+0.25)";
        } else if (isDreamingQuestion7) {
             negativeLabel = "Koszmary (-0.25)";
             neutralLabel = "Neutralne / Nie pamiętam (0)";
             positiveLabel = "Przyjemne (+0.25)";
        } else if (isDreamingQuestion8) {
             // Default labels for Sen Q8 ("Czy uniknąłeś nadmiernych bodźców przed snem?")
             negativeLabel = "Nie (-0.25)";
             neutralLabel = "Częściowo (0)";
             positiveLabel = "Tak (+0.25)";
        }
        // Default labels apply for the editable Q8 on other themes


        return (
          <div key={`${themeKey}-${index}`} className="space-y-3 p-4 border rounded-md bg-card shadow-sm">
             {isEditableQuestion8 ? (
               <Input
                 type="text"
                 id={`${themeKey}-q${index}-text`}
                 value={customQuestion8Text}
                 onChange={handleCustomQuestionChange}
                 placeholder="Enter your custom question 8"
                 className="text-sm font-medium text-foreground/90 block mb-2 border-dashed"
               />
             ) : (
               <Label htmlFor={`${themeKey}-q${index}-radiogroup`} className="text-sm font-medium text-foreground/90 block mb-2">
                 {index + 1}. {question}
               </Label>
             )}
            <RadioGroup
              id={`${themeKey}-q${index}-radiogroup`} // Changed ID to avoid conflict with label
              // Ensure value is a string for RadioGroup, default to '0' if undefined
              value={(detailedScores?.[index]?.toString()) ?? '0'}
              onValueChange={(value) => handleValueChange(index, value)}
              className="flex space-x-4 justify-center"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="-0.25" id={`${themeKey}-q${index}-neg`} aria-label={negativeLabel}/>
                <Label htmlFor={`${themeKey}-q${index}-neg`} className="text-xs text-muted-foreground">{negativeLabel}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="0" id={`${themeKey}-q${index}-neu`} aria-label={neutralLabel}/>
                <Label htmlFor={`${themeKey}-q${index}-neu`} className="text-xs text-muted-foreground">{neutralLabel}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="0.25" id={`${themeKey}-q${index}-pos`} aria-label={positiveLabel}/>
                <Label htmlFor={`${themeKey}-q${index}-pos`} className="text-xs text-muted-foreground">{positiveLabel}</Label>
              </div>
            </RadioGroup>
          </div>
        );
      })}
    </div>
  );
}

    