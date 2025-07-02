
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { FileText } from 'lucide-react';
import { CallCard } from './calls/CallCard';
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
      {calls.map((call) => (
        <CallCard
          key={call.id}
          call={call}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
};
