
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Trash2 } from 'lucide-react';
import { AudioPlayer } from '../AudioPlayer';
import { CallMetadataBadges } from './CallMetadataBadges';
import { TranscriptionDisplay } from './TranscriptionDisplay';
import { QualityAnalysisDisplay } from './QualityAnalysisDisplay';
import { CallDetailsAndTags } from './CallDetailsAndTags';
import type { Tables } from '@/integrations/supabase/types';

type Call = Tables<'calls'>;
type QualityScore = Tables<'quality_scores'>;
type Transcription = Tables<'transcriptions'>;
type CallTag = Tables<'call_tags'>;

interface CallWithDetails extends Call {
  quality_scores?: QualityScore[];
  transcriptions?: Transcription[];
  call_tags?: CallTag[];
}

interface CallCardProps {
  call: CallWithDetails;
  onDelete: (callId: string) => void;
}

export const CallCard = ({ call, onDelete }: CallCardProps) => {
  const qualityScore = call.quality_scores?.[0];
  const transcription = call.transcriptions?.[0];
  const tags = call.call_tags || [];

  const isTranscribing = call.status === 'uploaded' || call.status === 'transcribing';
  const isAnalyzing = call.status === 'transcribed' || call.status === 'analyzing';
  const requiresReview = qualityScore?.manual_review_required;
  const reviewStatus = qualityScore?.manual_review_status;

  return (
    <Card className={requiresReview && reviewStatus === 'pending' ? 'border-yellow-200 bg-yellow-50' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              {call.title}
              {requiresReview && reviewStatus === 'pending' && (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  Review Needed
                </Badge>
              )}
              {reviewStatus === 'approved' && (
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                  Approved
                </Badge>
              )}
              {reviewStatus === 'rejected' && (
                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                  Rejected
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Uploaded on {new Date(call.created_at!).toLocaleDateString()}
              {call.duration_seconds && ` • ${Math.floor(call.duration_seconds / 60)}:${(call.duration_seconds % 60).toString().padStart(2, '0')}`}
            </CardDescription>
            
            <CallMetadataBadges call={call} />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(call.id)}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Audio Player */}
        {call.file_url && (
          <div className="mb-6">
            <AudioPlayer 
              src={call.file_url} 
              title={`${call.title} - Audio Recording`}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TranscriptionDisplay 
            transcription={transcription}
            isTranscribing={isTranscribing}
          />

          <QualityAnalysisDisplay 
            qualityScore={qualityScore}
            isAnalyzing={isAnalyzing}
            callStatus={call.status!}
          />

          <CallDetailsAndTags 
            call={call}
            tags={tags}
          />
        </div>
      </CardContent>
    </Card>
  );
};
