
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FileText, ChevronDown, ChevronUp, Trash2, Play, Pause, Clock } from 'lucide-react';
import { AudioPlayer } from '../AudioPlayer';
import { TranscriptionDisplay } from './TranscriptionDisplay';
import { QualityAnalysisDisplay } from './QualityAnalysisDisplay';
import { CallDetailsAndTags } from './CallDetailsAndTags';
import { CallMetadataBadges } from './CallMetadataBadges';
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

const getStatusColor = (status: string) => {
  const colors = {
    uploaded: 'bg-blue-100 text-blue-800',
    transcribing: 'bg-yellow-100 text-yellow-800',
    transcribed: 'bg-green-100 text-green-800',
    analyzing: 'bg-purple-100 text-purple-800',
    analyzed: 'bg-emerald-100 text-emerald-800',
    reviewed: 'bg-gray-100 text-gray-800',
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

const formatDuration = (seconds: number | null) => {
  if (!seconds) return null;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const CallCard = ({ call, onDelete }: CallCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const qualityScore = call.quality_scores?.[0];
  const transcription = call.transcriptions?.[0];
  const tags = call.call_tags || [];

  const isAnalyzing = call.status === 'analyzing' || call.status === 'transcribing';

  const handleRetrySuccess = () => {
    // Trigger a refresh of the call data
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {call.title}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={getStatusColor(call.status || 'uploaded')}>
                {call.status || 'uploaded'}
              </Badge>
              {call.duration_seconds && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(call.duration_seconds)}
                </Badge>
              )}
              <CallMetadataBadges call={call} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(call.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-6">
              {/* Audio Player */}
              {call.file_url && (
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Audio
                  </h4>
                  <AudioPlayer
                    ref={audioRef}
                    src={call.file_url}
                    transcription={transcription}
                  />
                </div>
              )}

              {/* Transcription */}
              <TranscriptionDisplay
                transcription={transcription}
                isTranscribing={call.status === 'transcribing'}
                callStatus={call.status || 'uploaded'}
              />

              {/* Quality Analysis */}
              <QualityAnalysisDisplay
                qualityScore={qualityScore}
                isAnalyzing={isAnalyzing}
                callStatus={call.status || 'uploaded'}
                callId={call.id}
                onRetrySuccess={handleRetrySuccess}
              />

              {/* Call Details and Tags */}
              <CallDetailsAndTags call={call} tags={tags} />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
