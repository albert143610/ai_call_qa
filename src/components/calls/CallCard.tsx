
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FileText, ChevronDown, ChevronUp, Trash2, Play, Clock } from 'lucide-react';
import { AudioPlayer, AudioPlayerRef } from '../AudioPlayer';
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
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<AudioPlayerRef>(null);

  const qualityScore = call.quality_scores?.[0];
  const transcription = call.transcriptions?.[0];
  const tags = call.call_tags || [];

  const isAnalyzing = call.status === 'analyzing' || call.status === 'transcribing';

  const handleRetrySuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSeekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.seekTo(time);
    }
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handlePlayStateChange = (playing: boolean) => {
    setIsPlaying(playing);
  };

  return (
    <Card className="w-full transition-shadow duration-200 hover:shadow-md">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{call.title}</span>
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
            <div className="flex items-center gap-1 flex-shrink-0">
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-accent transition-colors"
                  aria-label={isExpanded ? "Collapse call details" : "Expand call details"}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(call.id)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                aria-label="Delete call"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent className="transition-all duration-200 ease-in-out">
          <CardContent className="pt-0">
            <div className="space-y-6">
              {/* Audio Player */}
              {call.file_url && (
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground">
                    <Play className="h-4 w-4" />
                    Audio
                  </h4>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <AudioPlayer
                      ref={audioRef}
                      src={call.file_url}
                      transcription={transcription}
                      onTimeUpdate={handleTimeUpdate}
                      isPlaying={isPlaying}
                      onPlayStateChange={handlePlayStateChange}
                    />
                  </div>
                </div>
              )}

              {/* Transcription */}
              <TranscriptionDisplay
                transcription={transcription}
                isTranscribing={call.status === 'transcribing'}
                currentTime={currentTime}
                isPlaying={isPlaying}
                onSeekTo={handleSeekTo}
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
