
import { Slider } from '@/components/ui/slider';

interface AudioProgressBarProps {
  currentTime: number;
  duration: number;
  isLoading: boolean;
  hasError: boolean;
  onSeek: (value: number[]) => void;
}

export const AudioProgressBar = ({ 
  currentTime, 
  duration, 
  isLoading, 
  hasError, 
  onSeek 
}: AudioProgressBarProps) => {
  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-2">
      <Slider
        value={[currentTime]}
        max={duration || 100}
        step={1}
        onValueChange={onSeek}
        className="w-full"
        disabled={isLoading || hasError}
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};
