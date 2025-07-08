
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, AlertCircle } from 'lucide-react';

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
      console.log('Retrying analysis for call:', callId, 'Current status:', currentStatus);
      
      // First, reset the call status to uploaded to allow retry
      console.log('Resetting call status to uploaded...');
      const { error: resetError } = await supabase
        .from('calls')
        .update({ 
          status: 'uploaded', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', callId);

      if (resetError) {
        console.error('Failed to reset call status:', resetError);
        throw new Error(`Failed to reset call status: ${resetError.message}`);
      }

      // Small delay to ensure the status is updated
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Now trigger the analysis
      console.log('Triggering analysis via edge function...');
      const { data, error } = await supabase.functions.invoke('process-call', {
        body: { callId }
      });

      if (error) {
        console.error('Edge function invocation error:', error);
        throw new Error(`Analysis failed: ${error.message}`);
      }

      console.log('Analysis retry response:', data);

      toast({
        title: "Analysis Retry Started",
        description: "The call analysis has been restarted. Please wait a moment for it to complete.",
      });

      if (onRetrySuccess) {
        // Delay the callback to allow the UI to update
        setTimeout(() => {
          onRetrySuccess();
        }, 2000);
      }
      
    } catch (error: any) {
      console.error('Retry failed:', error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to restart analysis. Please try again later.";
      
      if (error.message.includes('OpenAI')) {
        errorMessage = "AI analysis service is temporarily unavailable. Please try again later.";
      } else if (error.message.includes('audio')) {
        errorMessage = "Audio file processing failed. Please check the audio file and try again.";
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = "Network error. Please check your connection and try again.";
      }
      
      toast({
        title: "Retry Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsRetrying(false);
    }
  };

  // Show retry button for calls that need it
  const shouldShowRetry = ['uploaded', 'transcribing', 'analyzing', 'analyzed'].includes(currentStatus);

  if (!shouldShowRetry) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
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
      
      {currentStatus === 'analyzed' && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <AlertCircle className="h-3 w-3" />
          <span>This will restart the entire analysis process</span>
        </div>
      )}
    </div>
  );
};
