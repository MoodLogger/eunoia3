
"use client";

import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalculatedMoodDisplayProps {
  icon: LucideIcon | null;
  label: string;
  totalScore: number | null;
}

export function CalculatedMoodDisplay({ icon: Icon, label, totalScore }: CalculatedMoodDisplayProps) {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
        <div className="flex flex-col items-center justify-center py-4 space-y-2 animate-pulse">
            <div className="h-16 w-16 bg-muted rounded-full"></div>
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-4 bg-muted rounded w-1/6 mt-1"></div>
        </div>
    );
  }

  const getIconColor = (moodLabel: string): string => {
      switch (moodLabel) {
          case 'Good':
              return 'text-green-600 dark:text-green-400';
          case 'Normal':
              return 'text-yellow-600 dark:text-yellow-400';
          case 'Bad':
              return 'text-red-600 dark:text-red-400';
          case 'Obliczanie...': // Changed from 'Calculating...'
          case 'Calculating...': // Keep original English key for compatibility if label prop is not translated yet
              return 'text-muted-foreground animate-spin';
          default:
              return 'text-muted-foreground';
      }
  }

  const iconColorClass = getIconColor(label);
  const displayLabel = label === 'Calculating...' ? 'Obliczanie...' : label; // Ensure Polish label for calculating

  return (
    <div className="flex flex-col items-center justify-center py-4 space-y-2">
      {Icon ? (
        <Icon className={cn("h-16 w-16", iconColorClass)} />
      ) : (
         <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
            <span className="text-xs text-muted-foreground">?</span>
         </div>
      )}
      <span className={cn("text-lg font-medium", getIconColor(label).replace('animate-spin', ''))}>
        {displayLabel}
      </span>
      {totalScore !== null && label !== 'Calculating...' && label !== 'Obliczanie...' && (
        <span className="text-sm text-muted-foreground">
          Łączny Wynik: {totalScore > 0 ? `+${totalScore}` : totalScore}
        </span>
      )}
    </div>
  );
}
