
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

  // Determine icon color based on label
  const getIconColor = (moodLabel: string): string => {
      switch (moodLabel) {
          case 'Good':
              return 'text-green-500'; // Use Tailwind green for good
          case 'Normal':
              return 'text-yellow-500'; // Use Tailwind yellow for normal
          case 'Bad':
              return 'text-red-500'; // Use Tailwind red for bad
          default:
              return 'text-muted-foreground'; // Default color
      }
  }

  const iconColorClass = getIconColor(label);

  return (
    <div className="flex flex-col items-center justify-center py-4 space-y-2">
      {Icon ? (
        <Icon className={cn("h-16 w-16", iconColorClass)} />
      ) : (
        <Loader2 className="h-16 w-16 animate-spin text-muted-foreground" /> // Show loader if no icon (calculating)
      )}
      <span className={cn("text-lg font-medium", iconColorClass)}>
        {label}
      </span>
    </div>
  );
}
