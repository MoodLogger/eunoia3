
"use client";

import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react'; // Import Loader icon for calculating state
import { cn } from '@/lib/utils';

interface CalculatedMoodDisplayProps {
  icon: LucideIcon | null;
  label: string;
}

export function CalculatedMoodDisplay({ icon: Icon, label }: CalculatedMoodDisplayProps) {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true); // Ensure this runs only on the client after hydration
  }, []);

  if (!isClient) {
    // Render a placeholder on the server
    return (
        <div className="flex flex-col items-center justify-center py-4 space-y-2 animate-pulse">
            <div className="h-16 w-16 bg-muted rounded-full"></div>
            <div className="h-4 bg-muted rounded w-1/4"></div>
        </div>
    );
  }

  // Determine icon color based on label using theme colors
  const getIconColor = (moodLabel: string): string => {
      switch (moodLabel) {
          case 'Good':
              return 'text-green-600 dark:text-green-400'; // Use green shades for good
          case 'Normal':
              return 'text-yellow-600 dark:text-yellow-400'; // Use yellow shades for normal
          case 'Bad':
              return 'text-red-600 dark:text-red-400'; // Use red shades for bad
          case 'Calculating...':
              return 'text-muted-foreground animate-spin'; // Style for loader
          default:
              return 'text-muted-foreground'; // Default color
      }
  }

  const iconColorClass = getIconColor(label);

  return (
    <div className="flex flex-col items-center justify-center py-4 space-y-2">
      {Icon ? (
        // Apply color and animation for Loader2
        <Icon className={cn("h-16 w-16", iconColorClass)} />
      ) : (
         // Fallback if icon is somehow null but not calculating - could show a placeholder
         <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
            <span className="text-xs text-muted-foreground">?</span>
         </div>
      )}
      {/* Apply color to the label as well */}
      <span className={cn("text-lg font-medium", getIconColor(label).replace('animate-spin', ''))}> {/* Remove spin from label */}
        {label}
      </span>
    </div>
  );
}
