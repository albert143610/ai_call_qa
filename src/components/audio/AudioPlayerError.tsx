
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface AudioPlayerErrorProps {
  error: string;
  audioSrc: string;
  onRetry: () => void;
}

export const AudioPlayerError = ({ error, audioSrc, onRetry }: AudioPlayerErrorProps) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center gap-2 text-red-600">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Audio Error</span>
      </div>
      <p className="text-sm text-red-600 mt-1">{error}</p>
      <p className="text-xs text-red-500 mt-1">Audio URL: {audioSrc}</p>
      <Button 
        variant="outline" 
        size="sm" 
        className="mt-2"
        onClick={onRetry}
      >
        Retry
      </Button>
    </div>
  );
};
