
"use client";

import * as React from 'react';
import { Smile, Frown, Meh, Angry } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Mood } from '@/lib/types';

interface MoodSelectorProps {
  selectedMood: Mood;
  onMoodSelect: (mood: Mood) => void;
}

const moodOptions: { mood: Mood; icon: React.ElementType; label: string }[] = [
  { mood: 'happy', icon: Smile, label: 'Happy' },
  { mood: 'sad', icon: Frown, label: 'Sad' },
  { mood: 'neutral', icon: Meh, label: 'Neutral' },
  { mood: 'angry', icon: Angry, label: 'Angry' },
];

export function MoodSelector({ selectedMood, onMoodSelect }: MoodSelectorProps) {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true); // Ensure this runs only on the client after hydration
  }, []);

  if (!isClient) {
    // Render nothing or a placeholder on the server
    return null;
  }

  return (
    <div className="flex space-x-2 justify-center py-4">
      {moodOptions.map(({ mood, icon: Icon, label }) => (
        <Button
          key={mood}
          variant={selectedMood === mood ? 'default' : 'outline'}
          size="icon"
          onClick={() => onMoodSelect(mood)}
          aria-label={label}
          className={cn(
            "transition-transform transform hover:scale-110",
            selectedMood === mood ? 'bg-primary text-primary-foreground ring-2 ring-ring ring-offset-2' : 'bg-card text-card-foreground'
          )}
          style={{borderRadius: '50%'}} // Make button circular
        >
          <Icon className="h-6 w-6" />
        </Button>
      ))}
    </div>
  );
}
