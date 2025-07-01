
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { AudioPlayer } from './AudioPlayer';
import { Star, CheckCircle, XCircle, AlertTriangle, FileText, BarChart3 } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Call = Tables<'calls'>;
type QualityScore = Tables<'quality_scores'>;
type Transcription = Tables<'transcriptions'>;

interface CallWithDetails extends Call {
  quality_scores?: QualityScore[];
  transcriptions?: Transcription[];
}

interface ManualReviewInterfaceProps {
  callId: string;
  onReviewComplete?: () => void;
}

interface ReviewFormData {
  manual_review_notes: string;
  manual_review_status: 'approved' | 'rejected';
}

export const ManualReviewInterface = ({ callId, onReviewComplete }: ManualReviewInterfaceProps) => {
  const [call, setCall] = useState<CallWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { hasRole } = useUserRole();
  const { toast } = useToast();

  const form = useForm<ReviewFormData>({
    defaultValues: {
      manual_review_notes: '',
      manual_review_status: 'approved'
    }
  });

  useEffect(() => {
    fetchCallDetails();
  }, [callId]);

  const fetchCallDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('calls')
        .select(`
          *,
          quality_scores(*),
          transcriptions(*)
        `)
        .eq('id', callId)
        .single();

      if (error) throw error;
      setCall(data);

      // Pre-fill form with existing review data if available
      const qualityScore = data.quality_scores?.[0];
      if (qualityScore?.manual_review_notes) {
        form.setValue('manual_review_notes', qualityScore.manual_review_notes);
      }
      if (qualityScore?.manual_review_status && qualityScore.manual_review_status !== 'pending') {
        form.setValue('manual_review_status', qualityScore.manual_review_status as 'approved' | 'rejected');
      }
    } catch (error: any) {
      toast({
        title: "Error fetching call details",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ReviewFormData) => {
    if (!call?.quality_scores?.[0]) {
      toast({
        title: "Error",
        description: "No quality score found for this call",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('quality_scores')
        .update({
          manual_review_notes: data.manual_review_notes,
          manual_review_status: data.manual_review_status,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          human_feedback: data.manual_review_notes
        })
        .eq('id', call.quality_scores[0].id);

      if (error) throw error;

      // Update the call status to reviewed
      await supabase
        .from('calls')
        .update({ status: 'reviewed' })
        .eq('id', callId);

      // Update review assignment status
      await supabase
        .from('review_assignments')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('call_id', callId)
        .eq('reviewer_id', user?.id);

      toast({
        title: "Review submitted",
        description: `Call has been ${data.manual_review_status}`,
      });

      onReviewComplete?.();
    } catch (error: any) {
      toast({
        title: "Error submitting review",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!hasRole('reviewer')) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertTriangle className="h-12 w-12 text-red-400 mb-4" />
          <p className="text-gray-500">You don't have permission to review calls.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return <div>Loading call details...</div>;
  }

  if (!call) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">Call not found.</p>
        </CardContent>
      </Card>
    );
  }

  const qualityScore = call.quality_scores?.[0];
  const transcription = call.transcriptions?.[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Manual Review</h2>
          <p className="text-gray-600">{call.title}</p>
        </div>
        <Badge variant={call.status === 'reviewed' ? 'default' : 'secondary'}>
          {call.status}
        </Badge>
      </div>

      {/* Call Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Call Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p><span className="font-medium">Duration:</span> {call.duration_seconds ? `${Math.floor(call.duration_seconds / 60)}:${(call.duration_seconds % 60).toString().padStart(2, '0')}` : 'N/A'}</p>
              <p><span className="font-medium">Type:</span> {call.call_type || 'N/A'}</p>
              <p><span className="font-medium">Agent:</span> {call.agent_name || 'N/A'}</p>
            </div>
            <div className="space-y-2">
              <p><span className="font-medium">Department:</span> {call.department || 'N/A'}</p>
              <p><span className="font-medium">Customer:</span> {call.customer_phone || 'N/A'}</p>
              <p><span className="font-medium">Source:</span> {call.call_source || 'N/A'}</p>
            </div>
          </div>

          {/* Audio Player */}
          {call.file_url && (
            <div>
              <Separator className="my-4" />
              <AudioPlayer 
                src={call.file_url} 
                title={`${call.title} - Audio Recording`}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transcription */}
      {transcription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Transcription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm leading-relaxed">{transcription.content}</p>
              {transcription.confidence_score && (
                <p className="text-xs text-gray-500 mt-2">
                  Confidence Score: {(transcription.confidence_score * 100).toFixed(1)}%
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Quality Analysis */}
      {qualityScore && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              AI Quality Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{qualityScore.overall_satisfaction_score}/5</div>
                <div className="text-sm text-gray-600">Overall</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">{qualityScore.communication_score}/5</div>
                <div className="text-sm text-gray-600">Communication</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">{qualityScore.problem_resolution_score}/5</div>
                <div className="text-sm text-gray-600">Problem Resolution</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">{qualityScore.professionalism_score}/5</div>
                <div className="text-sm text-gray-600">Professionalism</div>
              </div>
            </div>

            {qualityScore.sentiment && (
              <div>
                <span className="text-sm font-medium">Sentiment: </span>
                <Badge variant={qualityScore.sentiment === 'positive' ? 'default' : qualityScore.sentiment === 'negative' ? 'destructive' : 'secondary'}>
                  {qualityScore.sentiment}
                </Badge>
              </div>
            )}

            {qualityScore.ai_feedback && (
              <div>
                <h4 className="font-medium mb-2">AI Feedback</h4>
                <div className="bg-blue-50 p-3 rounded text-sm">
                  {qualityScore.ai_feedback}
                </div>
              </div>
            )}

            {qualityScore.improvement_areas && qualityScore.improvement_areas.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Improvement Areas</h4>
                <div className="flex flex-wrap gap-2">
                  {qualityScore.improvement_areas.map((area, index) => (
                    <Badge key={index} variant="outline">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Manual Review Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Manual Review
          </CardTitle>
          <CardDescription>
            Provide your manual review and approval status for this call
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="manual_review_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Review Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your detailed review notes, feedback, and observations..."
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="manual_review_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Review Decision</FormLabel>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={field.value === 'approved' ? 'default' : 'outline'}
                        onClick={() => field.onChange('approved')}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        type="button"
                        variant={field.value === 'rejected' ? 'destructive' : 'outline'}
                        onClick={() => field.onChange('rejected')}
                        className="flex items-center gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </Button>
                <Button type="button" variant="outline" onClick={() => form.reset()}>
                  Reset
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
