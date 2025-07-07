
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';

interface RetryAnalysisButtonProps {
  callId: string;
  currentStatus: string;
  onRetrySuccess?: () => void;
}

export const RetryAnalysisButton = ({ 
  callId, 
  currentStatus, 
  onRetrySuccess 
}: RetryAnalysisButtonProps) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const { toast } = useToast();

  const handleRetry = async () => {
    setIsRetrying(true);
    
    try {
      console.log('Retrying analysis for call:', callId);
      
      const { data, error } = await supabase.functions.invoke('process-call', {
        body: { callId }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Analysis Retry Started",
        description: "The call analysis has been restarted. Please wait a moment for it to complete.",
      });

      if (onRetrySuccess) {
        onRetrySuccess();
      }
      
    } catch (error: any) {
      console.error('Retry failed:', error);
      toast({
        title: "Retry Failed",
        description: error.message || "Failed to restart analysis. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsRetrying(false);
    }
  };

  // Only show retry button for calls that are stuck or failed
  if (!['uploaded', 'transcribing', 'analyzing'].includes(currentStatus)) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRetry}
      disabled={isRetrying}
      className="flex items-center gap-2"
    >
      <RefreshCw className={`h-3 w-3 ${isRetrying ? 'animate-spin' : ''}`} />
      {isRetrying ? 'Retrying...' : 'Retry Analysis'}
    </Button>
  );
};
