
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Play, FileText, BarChart3, Trash2 } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Call = Tables<'calls'>;
type QualityScore = Tables<'quality_scores'>;
type Transcription = Tables<'transcriptions'>;

interface CallWithDetails extends Call {
  quality_scores?: QualityScore[];
  transcriptions?: Transcription[];
}

interface CallsListProps {
  refreshTrigger: number;
}

export const CallsList = ({ refreshTrigger }: CallsListProps) => {
  const [calls, setCalls] = useState<CallWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCalls = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('calls')
        .select(`
          *,
          quality_scores(*),
          transcriptions(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCalls(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching calls",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, [user, refreshTrigger]);

  const handleDelete = async (callId: string) => {
    try {
      const { error } = await supabase
        .from('calls')
        .delete()
        .eq('id', callId);

      if (error) throw error;

      toast({
        title: "Call deleted",
        description: "The call has been successfully deleted.",
      });

      fetchCalls();
    } catch (error: any) {
      toast({
        title: "Error deleting call",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      uploaded: 'bg-gray-100 text-gray-800',
      transcribing: 'bg-blue-100 text-blue-800',
      transcribed: 'bg-green-100 text-green-800',
      analyzing: 'bg-yellow-100 text-yellow-800',
      analyzed: 'bg-purple-100 text-purple-800',
      reviewed: 'bg-emerald-100 text-emerald-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getSentimentColor = (sentiment: string) => {
    const colors = {
      positive: 'bg-green-100 text-green-800',
      neutral: 'bg-yellow-100 text-yellow-800',
      negative: 'bg-red-100 text-red-800',
    };
    return colors[sentiment as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div>Loading calls...</div>;
  }

  if (calls.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No calls uploaded yet. Upload your first call to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Your Calls</h2>
      {calls.map((call) => {
        const qualityScore = call.quality_scores?.[0];
        const transcription = call.transcriptions?.[0];

        return (
          <Card key={call.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    {call.title}
                  </CardTitle>
                  <CardDescription>
                    Uploaded on {new Date(call.created_at!).toLocaleDateString()}
                    {call.duration_seconds && ` • ${Math.floor(call.duration_seconds / 60)}:${(call.duration_seconds % 60).toString().padStart(2, '0')}`}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(call.status!)}>
                    {call.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(call.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Transcription */}
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    Transcription
                  </h4>
                  {transcription ? (
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      {transcription.content.slice(0, 200)}
                      {transcription.content.length > 200 && '...'}
                      {transcription.confidence_score && (
                        <p className="text-xs text-gray-500 mt-2">
                          Confidence: {(transcription.confidence_score * 100).toFixed(1)}%
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">
                      {call.status === 'uploaded' ? 'Pending transcription' : 'Transcribing...'}
                    </p>
                  )}
                </div>

                {/* Quality Analysis */}
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-1">
                    <BarChart3 className="h-4 w-4" />
                    Quality Analysis
                  </h4>
                  {qualityScore ? (
                    <div className="space-y-2">
                      {qualityScore.ai_score && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">AI Score:</span>
                          <Badge variant="outline">{qualityScore.ai_score}/5</Badge>
                        </div>
                      )}
                      {qualityScore.sentiment && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Sentiment:</span>
                          <Badge className={getSentimentColor(qualityScore.sentiment)}>
                            {qualityScore.sentiment}
                          </Badge>
                        </div>
                      )}
                      {qualityScore.ai_feedback && (
                        <div className="bg-blue-50 p-2 rounded text-sm">
                          <p className="font-medium">AI Feedback:</p>
                          <p>{qualityScore.ai_feedback.slice(0, 150)}...</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">
                      {call.status === 'transcribed' ? 'Analyzing...' : 'Pending analysis'}
                    </p>
                  )}
                </div>

                {/* File Info */}
                <div className="space-y-2">
                  <h4 className="font-semibold">File Details</h4>
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">File:</span> {call.file_name}</p>
                    {call.file_url && (
                      <Button variant="link" asChild className="p-0 h-auto text-sm">
                        <a href={call.file_url} target="_blank" rel="noopener noreferrer">
                          Play Recording
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
