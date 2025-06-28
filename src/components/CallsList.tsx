
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Play, FileText, BarChart3, Trash2, Phone, User, Building2 } from 'lucide-react';
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
          transcriptions(*),
          call_tags(*)
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

  const getCallTypeColor = (callType: string) => {
    const colors = {
      inbound: 'bg-blue-100 text-blue-800',
      outbound: 'bg-green-100 text-green-800',
    };
    return colors[callType as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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
        const tags = call.call_tags || [];

        return (
          <Card key={call.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    {call.title}
                  </CardTitle>
                  <CardDescription>
                    Uploaded on {new Date(call.created_at!).toLocaleDateString()}
                    {call.duration_seconds && ` • ${Math.floor(call.duration_seconds / 60)}:${(call.duration_seconds % 60).toString().padStart(2, '0')}`}
                  </CardDescription>
                  
                  {/* Call Metadata */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge className={getStatusColor(call.status!)}>
                      {call.status}
                    </Badge>
                    {call.call_type && (
                      <Badge className={getCallTypeColor(call.call_type)}>
                        <Phone className="h-3 w-3 mr-1" />
                        {call.call_type}
                      </Badge>
                    )}
                    {call.agent_name && (
                      <Badge variant="outline">
                        <User className="h-3 w-3 mr-1" />
                        {call.agent_name}
                      </Badge>
                    )}
                    {call.department && (
                      <Badge variant="outline">
                        <Building2 className="h-3 w-3 mr-1" />
                        {call.department}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(call.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-1">
                    <BarChart3 className="h-4 w-4" />
                    Quality Analysis
                  </h4>
                  {qualityScore ? (
                    <div className="space-y-3">
                      {qualityScore.overall_satisfaction_score && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Overall Score:</span>
                          <Badge variant="outline" className="text-lg font-bold">
                            {qualityScore.overall_satisfaction_score}/5
                          </Badge>
                        </div>
                      )}
                      
                      {/* Detailed Scores */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {qualityScore.communication_score && (
                          <div className="flex justify-between">
                            <span>Communication:</span>
                            <span>{qualityScore.communication_score}/5</span>
                          </div>
                        )}
                        {qualityScore.problem_resolution_score && (
                          <div className="flex justify-between">
                            <span>Problem Resolution:</span>
                            <span>{qualityScore.problem_resolution_score}/5</span>
                          </div>
                        )}
                        {qualityScore.professionalism_score && (
                          <div className="flex justify-between">
                            <span>Professionalism:</span>
                            <span>{qualityScore.professionalism_score}/5</span>
                          </div>
                        )}
                        {qualityScore.empathy_score && (
                          <div className="flex justify-between">
                            <span>Empathy:</span>
                            <span>{qualityScore.empathy_score}/5</span>
                          </div>
                        )}
                      </div>
                      
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
                      
                      {qualityScore.improvement_areas && qualityScore.improvement_areas.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Improvement Areas:</p>
                          <div className="flex flex-wrap gap-1">
                            {qualityScore.improvement_areas.map((area, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {area}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">
                      {call.status === 'transcribed' ? 'Analyzing...' : 'Pending analysis'}
                    </p>
                  )}
                </div>

                {/* File Info & Tags */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Details & Tags</h4>
                  <div className="text-sm space-y-2">
                    <div>
                      <p><span className="font-medium">File:</span> {call.file_name}</p>
                      {call.call_source && (
                        <p><span className="font-medium">Source:</span> {call.call_source}</p>
                      )}
                      {call.customer_phone && (
                        <p><span className="font-medium">Customer:</span> {call.customer_phone}</p>
                      )}
                    </div>
                    
                    {tags.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Tags:</p>
                        <div className="flex flex-wrap gap-1">
                          {tags.map((tag) => (
                            <Badge key={tag.id} variant="outline" className="text-xs">
                              {tag.tag}
                              {tag.confidence_score && (
                                <span className="ml-1 text-gray-500">
                                  ({(tag.confidence_score * 100).toFixed(0)}%)
                                </span>
                              )}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
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
