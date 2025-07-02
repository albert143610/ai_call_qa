
import { Loader } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const LoadingSpinner = () => (
  <div className="flex items-center gap-2 text-blue-600">
    <Loader className="h-4 w-4 animate-spin" />
    <span className="text-sm">Processing...</span>
  </div>
);

export const TranscriptionLoadingState = () => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <Loader className="h-4 w-4 animate-spin text-blue-600" />
      <span className="text-sm text-blue-600">Transcribing audio...</span>
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
);

export const QualityAnalysisLoadingState = () => (
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      <Loader className="h-4 w-4 animate-spin text-yellow-600" />
      <span className="text-sm text-yellow-600">Analyzing quality...</span>
    </div>
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-12" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
      </div>
      <Skeleton className="h-16 w-full" />
    </div>
  </div>
);
