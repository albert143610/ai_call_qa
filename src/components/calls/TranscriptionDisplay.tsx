
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
    <div className="space-y-4">
      <h4 className="font-semibold flex items-center gap-2">
        <FileText className="h-4 w-4" />
        Transcription
      </h4>
      {transcription ? (
        <div className="space-y-4">
          {/* Full transcription with better formatting */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <p className="font-medium text-sm text-gray-700 mb-3">Full Transcript:</p>
            <div className="text-sm leading-relaxed text-gray-800 max-h-40 overflow-y-auto">
              {transcription.content}
            </div>
            {transcription.confidence_score && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                  Confidence: <span className="font-medium">{(transcription.confidence_score * 100).toFixed(1)}%</span>
                </p>
              </div>
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
