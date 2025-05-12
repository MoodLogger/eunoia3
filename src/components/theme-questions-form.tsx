
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


// Function to get questions, now handles specific questions and the 8th question for themes
const getQuestionsForTheme = (themeKey: keyof ThemeScores): string[] => {
  const questions: string[] = [];
  const label = themeLabelMap[themeKey] || themeKey; // Get the friendly label

   if (themeKey === 'dreaming') {
        questions.push("O której położyłeś się do łóżka?"); // Q1
        questions.push("Jak szybko usnąłeś?"); // Q2
        questions.push("O której się obudziłeś?"); // Q3
        questions.push("Czy był potrzebny budzik?"); // Q4
        questions.push("Czy budziłeś się w nocy?"); // Q5
        questions.push("Czy czułeś się wyspany?"); // Q6
        questions.push("Jakie miałeś sny?"); // Q7
        questions.push("Czy uniknąłeś nadmiernych bodźców przed snem?"); // Q8
   } else if (themeKey === 'moodScore') {
        questions.push("Jak się czujesz fizycznie?"); // Q1
        questions.push("Jaki masz nastrój?"); // Q2
        questions.push("Czy czujesz lęk przed nadchodzącym dniem?"); // Q3
        questions.push("Czy zaplanowałeś dzień?"); // Q4
        questions.push("Czy zwizualizowałeś swoje życiowe priorytety?"); // Q5
        questions.push("Czy skupiłeś się na wdzięczności?"); // Q6
        questions.push("Czy zacząłeś dzień od pozytywnej afirmacji?"); // Q7
        questions.push("Czy zapisałem jakąś myśl?"); // Q8
    } else if (themeKey === 'training') {
        questions.push("Ile czasu byłeś na świeżym powietrzu?"); // Q1
        questions.push("Ile zrobiłeś kroków?"); // Q2
        questions.push("Ile spaliłeś kalorii?"); // Q3
        questions.push("Ile czasu poświęciłeś na trening?"); // Q4
        questions.push("Czy był trening mięśni?"); // Q5
        questions.push("Czy robiłeś stretching?"); // Q6
        questions.push("Czy robiłeś ćwiczenia oddechowe?"); // Q7
        questions.push("Czy chodziłeś po schodach?"); // Q8
    } else if (themeKey === 'diet') {
        questions.push("Nawodnienie"); // Q1 (Kept specific)
        questions.push("Jaka zmiana masy?"); // Q2
        questions.push("W jakich godzinach jadłeś?"); // Q3
        questions.push("Co jadłeś na główny posiłek?"); // Q4
        questions.push("Czy jadłeś słodycze?"); // Q5
        questions.push("Czy piłeś alkohol?"); // Q6
        questions.push("Ile razy jadłeś warzywa i owoce?"); // Q7
        questions.push("Jakie miałeś ciśnienie?"); // Q8
    } else if (themeKey === 'socialRelations') {
        questions.push("Jak zachowałeś się podczas dojazdów?"); // Q1
        questions.push("Czy odbyłeś konstruktywną rozmowę szefem?"); // Q2
        questions.push("Czy miałeś smalltalk z kimś obcym?"); // Q3
        questions.push("Czy pochwaliłeś współpracownika?"); // Q4
        questions.push("Czy byłeś aktywny na spotkaniu?"); // Q5
        questions.push("Czy dogryzałem innym?"); // Q6
        questions.push("Czy byłem asertywny wobec innych?"); // Q7
        questions.push("Zainicjowałem kontakt z jakąś osobą?"); // Q8
    } else if (themeKey === 'familyRelations') {
        questions.push("Czy rozmawiałeś z rodzicami/teściami?"); // Q1
        questions.push("Czy poświęciłeś uwagę żonie?"); // Q2
        questions.push("Czy poświęciłeś uwagę synowi?"); // Q3
        questions.push("Czy pomogłeś w obowiązkach domowych?"); // Q4
        questions.push("Czy zrobiłeś przyjemność żonie?"); // Q5
        questions.push("Czy pomogłeś w lekcjach?"); // Q6
        questions.push("Czy zorganizowałeś wspólne spędzenie czasu?"); // Q7
        questions.push("Czy zakończyliście dzień w miłej atmosferze?"); // Q8
    } else if (themeKey === 'selfEducation') { // Add specific questions for Rozwój intelektualny
        questions.push("Czy poświęciłeś czas na czytanie?"); // Q1
        questions.push("Czy uczyłeś się języka obcego?"); // Q2
        questions.push("Czy obejrzałeś/wysłuchałeś coś wartościowego?"); // Q3
        questions.push("Czy uczyłeś się programowania?"); // Q4
        questions.push("Czy zrobiłeś kurs/quiz on-line?"); // Q5
        questions.push("Podałeś nowy pomysł na coś?"); // Q6
        questions.push("Poświęciłeś czas finansom?"); // Q7
        questions.push("Pracowałeś nad Eunoią?"); // Q8
     }
     else {
         // Default logic for any other UNEXPECTED themes (should not happen with current types)
         for (let i = 0; i < 8; i++) {
            // Default placeholders for questions 1-8
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

   // State for the editable question text - Q8 is NO LONGER editable for any defined theme
   const isEditableThemeQ8 = false; // !['dreaming', 'moodScore', 'training', 'diet', 'socialRelations', 'familyRelations', 'selfEducation'].includes(themeKey);
   const [customQuestion8Text, setCustomQuestion8Text] = React.useState(''); // No custom text needed initially
   const [isClient, setIsClient] = React.useState(false);

   React.useEffect(() => {
     setIsClient(true);
     // Clear custom question text state if themeKey changes after mount
     setCustomQuestion8Text('');
   }, [themeKey]);


   const questions = getQuestionsForTheme(themeKey);


  const handleValueChange = (questionIndex: number, value: string) => {
    const score = parseFloat(value) as QuestionScore;
    if ([-0.25, 0, 0.25].includes(score)) {
      onQuestionScoreChange(themeKey, questionIndex, score);
    }
  };

   // Handler for changing the custom question text (kept for potential future use, but not currently enabled)
   const handleCustomQuestionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
     setCustomQuestion8Text(event.target.value);
     // Here you might want to also save this custom question text back to your
     // main data store (e.g., in the DailyEntry within localStorage/Firestore)
     // This requires lifting the state or using a callback prop.
   };

   if (!isClient) {
    return <div>Loading questions...</div>; // Or a skeleton loader
  }

  const themeTitle = themeLabelMap[themeKey] ? `${themeLabelMap[themeKey]} Questions` : `${themeLabel} Questions`;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-center text-primary">
         {themeTitle === 'Sen Questions' ? 'Pytania na temat snu' : themeTitle}
      </h3>
      {questions.map((question, index) => {
        const isDietQuestion1 = themeKey === 'diet' && index === 0;
        const isDietQuestion2 = themeKey === 'diet' && index === 1; // Check for Diet Q2
        const isDietQuestion3 = themeKey === 'diet' && index === 2; // Check for Diet Q3
        const isDietQuestion4 = themeKey === 'diet' && index === 3; // Check for Diet Q4
        const isDietQuestion5 = themeKey === 'diet' && index === 4; // Check for Diet Q5
        const isDietQuestion6 = themeKey === 'diet' && index === 5; // Check for Diet Q6
        const isDietQuestion7 = themeKey === 'diet' && index === 6; // Check for Diet Q7
        const isDreamingQuestion1 = themeKey === 'dreaming' && index === 0;
        const isDreamingQuestion2 = themeKey === 'dreaming' && index === 1;
        const isDreamingQuestion3 = themeKey === 'dreaming' && index === 2;
        const isDreamingQuestion4 = themeKey === 'dreaming' && index === 3;
        const isDreamingQuestion5 = themeKey === 'dreaming' && index === 4;
        const isDreamingQuestion6 = themeKey === 'dreaming' && index === 5;
        const isDreamingQuestion7 = themeKey === 'dreaming' && index === 6;
        const isDreamingQuestion8 = themeKey === 'dreaming' && index === 7; // Identify Sen Q8
        const isMoodQuestion1 = themeKey === 'moodScore' && index === 0; // Identify Nastawienie Q1
        const isMoodQuestion2 = themeKey === 'moodScore' && index === 1; // Identify Nastawienie Q2
        const isMoodQuestion3 = themeKey === 'moodScore' && index === 2; // Identify Nastawienie Q3
        const isMoodQuestion4 = themeKey === 'moodScore' && index === 3; // Identify Nastawienie Q4
        const isMoodQuestion5 = themeKey === 'moodScore' && index === 4; // Identify Nastawienie Q5
        const isMoodQuestion6 = themeKey === 'moodScore' && index === 5; // Identify Nastawienie Q6
        const isMoodQuestion7 = themeKey === 'moodScore' && index === 6; // Identify Nastawienie Q7
        const isMoodQuestion8 = themeKey === 'moodScore' && index === 7; // Identify Nastawienie Q8
        const isTrainingQuestion1 = themeKey === 'training' && index === 0; // Identify Fitness Q1
        const isTrainingQuestion2 = themeKey === 'training' && index === 1; // Identify Fitness Q2
        const isTrainingQuestion3 = themeKey === 'training' && index === 2; // Identify Fitness Q3
        const isTrainingQuestion4 = themeKey === 'training' && index === 3; // Identify Fitness Q4
        const isTrainingQuestion5 = themeKey === 'training' && index === 4; // Identify Fitness Q5
        const isTrainingQuestion6 = themeKey === 'training' && index === 5; // Identify Fitness Q6
        const isTrainingQuestion7 = themeKey === 'training' && index === 6; // Identify Fitness Q7
        const isTrainingQuestion8 = themeKey === 'training' && index === 7; // Identify Fitness Q8
        const isEditableQuestion8 = index === 7 && isEditableThemeQ8; // Check if Q8 should be editable (currently false)


        const defaultNegativeLabel = "Negative";
        const defaultNeutralLabel = "Neutral";
        const defaultPositiveLabel = "Positive";

        let negativeLabel = defaultNegativeLabel;
        let neutralLabel = defaultNeutralLabel;
        let positiveLabel = defaultPositiveLabel;

        // Apply specific labels based on theme and question index
        if (isDietQuestion1) {
            negativeLabel = "<1 litr"; // Corrected label
            neutralLabel = "1-2 litry";
            positiveLabel = ">2 litry";
        } else if (isDietQuestion2) { // Add labels for Diet Q2
            negativeLabel = "wzrost o ponad 0,3 kg";
            neutralLabel = "bez zmian";
            positiveLabel = "spadek o ponad 0,3 kg";
        } else if (isDietQuestion3) { // Add labels for Diet Q3
             negativeLabel = "za wcześnie i za późno";
             neutralLabel = "przekroczony jeden czas";
             positiveLabel = "w godz. 10-20";
        } else if (isDietQuestion4) { // Add labels for Diet Q4
             negativeLabel = "przetworzone/wieprzowina";
             neutralLabel = "drób/wołowina";
             positiveLabel = "ryba/vege";
        } else if (isDietQuestion5) { // Add labels for Diet Q5
             negativeLabel = "tak";
             neutralLabel = "raz i mało";
             positiveLabel = "nie";
        } else if (isDietQuestion6) { // Add labels for Diet Q6
             negativeLabel = "tak";
             neutralLabel = "lampkę wina";
             positiveLabel = "nie";
        } else if (isDietQuestion7) { // Add labels for Diet Q7
             negativeLabel = "wcale";
             neutralLabel = "2-3 razy";
             positiveLabel = "4 i więcej";
        } else if (isDreamingQuestion1) {
            negativeLabel = "po g. 23"; // Reverted
            neutralLabel = "między g. 22 a 23"; // Reverted
            positiveLabel = "przed g. 22"; // Reverted
        } else if (isDreamingQuestion2) {
            negativeLabel = "Ponad godzinę";
            neutralLabel = "ok. pół godziny";
            positiveLabel = "ok. kwadrans";
        } else if (isDreamingQuestion3) {
            negativeLabel = "po g. 7";
            neutralLabel = "ok. 6:30";
            positiveLabel = "ok. g. 6";
        } else if (isDreamingQuestion4) {
            negativeLabel = "Musiał dzwonić kilka razy";
            neutralLabel = "Wstałem po jednym dzwonku";
            positiveLabel = "Wstałem przed budzikiem";
        } else if (isDreamingQuestion5) {
            negativeLabel = "tak i miałem problem z ponownym zaśnięciem";
            neutralLabel = "tak, na krótko";
            positiveLabel = "nie";
        } else if (isDreamingQuestion6) {
            negativeLabel = "Byłem nieprzytomny";
            neutralLabel = "Lekko niedospany";
            positiveLabel = "Tak, pełen energii";
        } else if (isDreamingQuestion7) {
             negativeLabel = "Koszmary";
             neutralLabel = "Neutralne / Nie pamiętam";
             positiveLabel = "Przyjemne";
        } else if (isDreamingQuestion8) {
             // Default labels for Sen Q8 ("Czy uniknąłeś nadmiernych bodźców przed snem?")
             negativeLabel = "Nie";
             neutralLabel = "Częściowo";
             positiveLabel = "Tak";
        } else if (isMoodQuestion1) {
             // Labels for Nastawienie Q1 ("Jak się czujesz fizycznie?")
             negativeLabel = "ból/infekcja";
             neutralLabel = "średnio/zmęczenie";
             positiveLabel = "znakomicie";
        } else if (isMoodQuestion2) {
             // Labels for Nastawienie Q2 ("Jaki masz nastrój?")
             negativeLabel = "przygnębienie/smutek";
             neutralLabel = "neutralny";
             positiveLabel = "entuzjastyczny";
        } else if (isMoodQuestion3) {
             // Labels for Nastawienie Q3 ("Czy czujesz lęk przed nadchodzącym dniem?")
             negativeLabel = "boję się";
             neutralLabel = "mam stres";
             positiveLabel = "brak lęku";
        } else if (isMoodQuestion4) {
             // Labels for Nastawienie Q4 ("Czy zaplanowałeś dzień?")
             negativeLabel = "brak planu";
             neutralLabel = "jest plan ogólny";
             positiveLabel = "plan z checklistą";
        } else if (isMoodQuestion5) {
             // Labels for Nastawienie Q5 ("Czy zwizualizowałeś swoje życiowe priorytety?")
             negativeLabel = "zapomniałem";
             neutralLabel = "próbowałem ale rozproszyłem się";
             positiveLabel = "mam focus na cel";
        } else if (isMoodQuestion6) {
             // Labels for Nastawienie Q6 ("Czy skupiłeś się na wdzięczności?")
             negativeLabel = "nie";
             neutralLabel = "na chwilę ale mało konkretnie";
             positiveLabel = "tak dogłębnie";
        } else if (isMoodQuestion7) {
             // Labels for Nastawienie Q7 ("Czy zacząłeś dzień od pozytywnej afirmacji?")
             negativeLabel = "nie";
             neutralLabel = "tak ale mało przekonująco";
             positiveLabel = "tak i podziałało";
        } else if (isMoodQuestion8) {
             // Labels for Nastawienie Q8 ("Czy zapisałem jakąś myśl?")
             negativeLabel = "nie";
             neutralLabel = "tak ale nic istotnego";
             positiveLabel = "tak coś wartościowego";
        } else if (isTrainingQuestion1) {
             // Labels for Fitness Q1 ("Ile czasu byłeś na świeżym powietrzu?")
             negativeLabel = "poniżej 30 min.";
             neutralLabel = "ok. 45 min.";
             positiveLabel = "ponad godzinę";
        } else if (isTrainingQuestion2) {
             // Labels for Fitness Q2 ("Ile zrobiłeś kroków?")
             negativeLabel = "mniej niż 4k";
             neutralLabel = "4-6k";
             positiveLabel = "powyżej 6k";
        } else if (isTrainingQuestion3) {
             // Labels for Fitness Q3 ("Ile spaliłeś kalorii?")
             negativeLabel = "mniej niż 300";
             neutralLabel = "300-500";
             positiveLabel = "powyżej 500";
        } else if (isTrainingQuestion4) {
            // Labels for Fitness Q4 ("Ile czasu poświęciłeś na trening?")
            negativeLabel = "mniej niż 15 min";
            neutralLabel = "15-30 min";
            positiveLabel = "ponad 45 min";
        } else if (isTrainingQuestion5) {
            // Labels for Fitness Q5 ("Czy był trening mięśni?")
            negativeLabel = "nie";
            neutralLabel = "częściowy";
            positiveLabel = "3 partie ciała";
        } else if (isTrainingQuestion6) {
             // Labels for Fitness Q6 ("Czy robiłeś stretching?")
             negativeLabel = "nie";
             neutralLabel = "częściowy";
             positiveLabel = "pełny";
        } else if (isTrainingQuestion7) {
            // Labels for Fitness Q7 ("Czy robiłeś ćwiczenia oddechowe?")
             negativeLabel = "nie";
             neutralLabel = "powierzchownie";
             positiveLabel = "gruntownie";
        } else if (isTrainingQuestion8) {
            // Labels for Fitness Q8 ("Czy chodziłeś po schodach?")
             negativeLabel = "nie";
             neutralLabel = "do 3 p.";
             positiveLabel = "więcej niż 3 p.";
        }
        // Default labels apply for other themes (Relacje zewnętrzne, Relacje rodzinne, Rozwój intelektualny)


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
                {/* Display descriptive label AND point value */}
                <Label htmlFor={`${themeKey}-q${index}-neg`} className="text-xs text-muted-foreground">
                  {negativeLabel} {`(-0.25)`}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="0" id={`${themeKey}-q${index}-neu`} aria-label={neutralLabel}/>
                 {/* Display descriptive label AND point value */}
                <Label htmlFor={`${themeKey}-q${index}-neu`} className="text-xs text-muted-foreground">
                   {neutralLabel} {`(0)`}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="0.25" id={`${themeKey}-q${index}-pos`} aria-label={positiveLabel}/>
                 {/* Display descriptive label AND point value */}
                <Label htmlFor={`${themeKey}-q${index}-pos`} className="text-xs text-muted-foreground">
                  {positiveLabel} {`(+0.25)`}
                </Label>
              </div>
            </RadioGroup>
          </div>
        );
      })}
    </div>
  );
}

