
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface AudioControlsProps {
  isPlaying: boolean;
  isLoading: boolean;
  hasError: boolean;
  onTogglePlay: () => void;
  onSkip: (seconds: number) => void;
}

export const AudioControls = ({ 
  isPlaying, 
  isLoading, 
  hasError, 
  onTogglePlay, 
  onSkip 
}: AudioControlsProps) => {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onSkip(-15)}
        disabled={isLoading || hasError}
      >
        <SkipBack className="h-4 w-4" />
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onTogglePlay}
        disabled={isLoading || hasError}
        className="w-12 h-8"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onSkip(15)}
        disabled={isLoading || hasError}
      >
        <SkipForward className="h-4 w-4" />
      </Button>
    </div>
  );
};
