
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
      
      // Clean up any existing quality scores that might be preventing retry
      console.log('Cleaning up existing analysis data...');
      const { error: qualityDeleteError } = await supabase
        .from('quality_scores')
        .delete()
        .eq('call_id', callId);

      if (qualityDeleteError) {
        console.warn('Could not clean up quality scores:', qualityDeleteError);
        // Don't fail the retry for this, just log it
      }

      // Reset the call status to uploaded to allow retry
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

      // Add a longer delay to ensure the status is updated and any background processes stop
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Now trigger the analysis with timeout
      console.log('Triggering analysis via edge function...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      try {
        const { data, error } = await supabase.functions.invoke('process-call', {
          body: { callId },
          headers: {
            'Content-Type': 'application/json'
          }
        });

        clearTimeout(timeoutId);

        if (error) {
          console.error('Edge function invocation error:', error);
          throw new Error(`Analysis failed: ${error.message}`);
        }

        console.log('Analysis retry response:', data);

        toast({
          title: "Analysis Started",
          description: "The call analysis has been restarted successfully. Results will appear shortly.",
        });

        if (onRetrySuccess) {
          // Delay the callback to allow the UI to update
          setTimeout(() => {
            onRetrySuccess();
          }, 3000);
        }
      } catch (invokeError) {
        clearTimeout(timeoutId);
        throw invokeError;
      }
      
    } catch (error: any) {
      console.error('Retry failed:', error);
      
      // Provide more specific error messages based on error type
      let errorMessage = "Failed to restart analysis. Please try again later.";
      let errorTitle = "Retry Failed";
      
      if (error.message.includes('OpenAI') || error.message.includes('AI')) {
        errorMessage = "AI analysis service is temporarily unavailable. The system will use basic analysis as a fallback.";
        errorTitle = "AI Service Unavailable";
      } else if (error.message.includes('audio') || error.message.includes('transcription')) {
        errorMessage = "Audio file processing failed. Please check that the audio file is valid and try again.";
        errorTitle = "Audio Processing Error";
      } else if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('timeout')) {
        errorMessage = "Network error or timeout occurred. Please check your connection and try again.";
        errorTitle = "Connection Error";
      } else if (error.message.includes('status')) {
        errorMessage = "Could not update call status. Please refresh the page and try again.";
        errorTitle = "Status Update Error";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });

      // Reset retry state after a delay to allow user to try again
      setTimeout(() => {
        if (onRetrySuccess) {
          onRetrySuccess();
        }
      }, 1000);
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
