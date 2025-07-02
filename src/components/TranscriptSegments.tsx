
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, ChevronDown, ChevronUp } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type TranscriptionSegment = Tables<'transcription_segments'>;

interface TranscriptSegmentsProps {
  transcriptionId: string;
  showExpanded?: boolean;
}

export const TranscriptSegments = ({ transcriptionId, showExpanded = false }: TranscriptSegmentsProps) => {
  const [segments, setSegments] = useState<TranscriptionSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(showExpanded);

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

    fetchSegments();
  }, [transcriptionId]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getConfidenceColor = (confidence: number | null) => {
    if (!confidence) return 'bg-gray-100 text-gray-800';
    if (confidence >= 0.9) return 'bg-green-100 text-green-800';
    if (confidence >= 0.7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (segments.length === 0) {
    return (
      <p className="text-gray-500 text-sm">No segmented transcription available</p>
    );
  }

  const visibleSegments = expanded ? segments : segments.slice(0, 3);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold flex items-center gap-1">
          <Clock className="h-4 w-4" />
          Transcript Timeline ({segments.length} segments)
        </h4>
        {segments.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show All
              </>
            )}
          </Button>
        )}
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {visibleSegments.map((segment) => (
          <Card key={segment.id} className="border-l-4 border-l-blue-500">
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {formatTime(segment.start_time)} - {formatTime(segment.end_time)}
                  </Badge>
                  {segment.confidence_score && (
                    <Badge className={`text-xs ${getConfidenceColor(segment.confidence_score)}`}>
                      {(segment.confidence_score * 100).toFixed(0)}% confidence
                    </Badge>
                  )}
                </div>
                {segment.word_count && (
                  <span className="text-xs text-gray-500">
                    {segment.word_count} words
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed">{segment.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {!expanded && segments.length > 3 && (
        <p className="text-xs text-gray-500 text-center">
          Showing {visibleSegments.length} of {segments.length} segments
        </p>
      )}
    </div>
  );
};
