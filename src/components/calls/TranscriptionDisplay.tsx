
import { FileText } from 'lucide-react';
import { TranscriptionLoadingState } from './LoadingStates';
import { TranscriptSegments } from '../TranscriptSegments';
import type { Tables } from '@/integrations/supabase/types';

type Transcription = Tables<'transcriptions'>;

interface TranscriptionDisplayProps {
  transcription?: Transcription;
  isTranscribing: boolean;
}

export const TranscriptionDisplay = ({ 
  transcription, 
  isTranscribing 
}: TranscriptionDisplayProps) => {
  return (
    <div className="space-y-2">
      <h4 className="font-semibold flex items-center gap-1">
        <FileText className="h-4 w-4" />
        Transcription
      </h4>
      {transcription ? (
        <div className="space-y-4">
          {/* Original full transcription */}
          <div className="bg-gray-50 p-3 rounded text-sm">
            <p className="font-medium text-xs text-gray-600 mb-2">Full Transcript:</p>
            {transcription.content.slice(0, 200)}
            {transcription.content.length > 200 && '...'}
            {transcription.confidence_score && (
              <p className="text-xs text-gray-500 mt-2">
                Confidence: {(transcription.confidence_score * 100).toFixed(1)}%
              </p>
            )}
          </div>
          
          {/* Timestamped segments */}
          <TranscriptSegments transcriptionId={transcription.id} />
        </div>
      ) : isTranscribing ? (
        <TranscriptionLoadingState />
      ) : (
        <p className="text-gray-500 text-sm">No transcription available</p>
      )}
    </div>
  );
};
