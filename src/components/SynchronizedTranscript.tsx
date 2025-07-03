
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Pause } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type TranscriptionSegment = Tables<'transcription_segments'>;

interface SynchronizedTranscriptProps {
  transcriptionId: string;
  currentTime: number;
  isPlaying: boolean;
  onSeekTo: (time: number) => void;
}

export const SynchronizedTranscript = ({ 
  transcriptionId, 
  currentTime, 
  isPlaying,
  onSeekTo 
}: SynchronizedTranscriptProps) => {
  const [segments, setSegments] = useState<TranscriptionSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);

  // Fetch transcript segments
  useEffect(() => {
    const fetchSegments = async () => {
      try {
        const { data, error } = await supabase
          .from('transcription_segments')
          .select('*')
          .eq('transcription_id', transcriptionId)
          .order('start_time', { ascending: true });

        if (error) throw error;
        setSegments(data || []);
      } catch (error) {
        console.error('Error fetching transcript segments:', error);
      } finally {
        setLoading(false);
      }
    };

    if (transcriptionId) {
      fetchSegments();
    }
  }, [transcriptionId]);

  // Update active segment based on current time
  useEffect(() => {
    const activeSegment = segments.find(segment => 
      currentTime >= segment.start_time && currentTime <= segment.end_time
    );
    setActiveSegmentId(activeSegment?.id || null);
  }, [currentTime, segments]);

  const handleSegmentClick = (startTime: number) => {
    onSeekTo(startTime);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getSpeaker = (text: string) => {
    if (text.startsWith('Customer:')) return 'Customer';
    if (text.startsWith('Agent:')) return 'Agent';
    return 'Unknown';
  };

  const getSegmentText = (text: string) => {
    return text.replace(/^(Customer:|Agent:)\s*/, '');
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
      </div>
    );
  }

  if (segments.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        No timestamped segments available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h5 className="text-sm font-medium">Interactive Transcript</h5>
        {isPlaying ? (
          <Pause className="h-3 w-3 text-green-600" />
        ) : (
          <Play className="h-3 w-3 text-gray-400" />
        )}
      </div>
      
      <ScrollArea className="h-64 border rounded-lg p-3">
        <div className="space-y-3">
          {segments.map((segment) => {
            const isActive = segment.id === activeSegmentId;
            const speaker = getSpeaker(segment.text);
            const text = getSegmentText(segment.text);
            
            return (
              <div
                key={segment.id}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  isActive 
                    ? 'bg-blue-50 border-l-4 border-blue-500 shadow-sm' 
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => handleSegmentClick(segment.start_time)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={speaker === 'Customer' ? 'outline' : 'secondary'}
                        className="text-xs"
                      >
                        {speaker}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatTime(segment.start_time)}
                      </span>
                      {segment.confidence_score && (
                        <span className="text-xs text-gray-400">
                          {(segment.confidence_score * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <p className={`text-sm leading-relaxed ${
                      isActive ? 'text-blue-900 font-medium' : 'text-gray-700'
                    }`}>
                      {text}
                    </p>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-800 p-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSegmentClick(segment.start_time);
                    }}
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
      
      <div className="text-xs text-gray-500">
        Click on any segment to jump to that moment in the audio
      </div>
    </div>
  );
};
