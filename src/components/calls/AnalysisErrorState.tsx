
import { AlertTriangle, RefreshCw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RetryAnalysisButton } from './RetryAnalysisButton';

interface AnalysisErrorStateProps {
  callId: string;
  callStatus: string;
  errorType: 'failed' | 'stuck' | 'incomplete';
  onRetrySuccess?: () => void;
}

export const AnalysisErrorState = ({
  callId,
  callStatus,
  errorType,
  onRetrySuccess
}: AnalysisErrorStateProps) => {
  const getErrorConfig = () => {
    switch (errorType) {
      case 'failed':
        return {
          icon: <AlertTriangle className="h-4 w-4 text-destructive" />,
          title: 'AI Analysis Failed',
          description: 'The AI analysis encountered an error and could not be completed. The system fell back to basic analysis where possible. Quality scores may be limited.',
          bgColor: 'bg-destructive/5',
          borderColor: 'border-destructive/20',
          textColor: 'text-destructive-foreground',
          titleColor: 'text-destructive'
        };
      case 'stuck':
        return {
          icon: <RefreshCw className="h-4 w-4 text-yellow-600 animate-spin" />,
          title: 'Analysis In Progress',
          description: 'The AI analysis is taking longer than usual. This may be due to complex transcript content or high server load. Please wait or try refreshing.',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-700',
          titleColor: 'text-yellow-800'
        };
      case 'incomplete':
        return {
          icon: <FileText className="h-4 w-4 text-orange-600" />,
          title: 'Basic Analysis Available',
          description: 'Advanced AI analysis was not available, but basic quality metrics have been calculated based on call structure and content patterns.',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-700',
          titleColor: 'text-orange-800'
        };
      default:
        return {
          icon: <AlertTriangle className="h-4 w-4 text-muted-foreground" />,
          title: 'Analysis Issue',
          description: 'An unexpected issue occurred during analysis. The system will attempt to provide basic quality metrics where possible.',
          bgColor: 'bg-muted/50',
          borderColor: 'border-muted',
          textColor: 'text-muted-foreground',
          titleColor: 'text-foreground'
        };
    }
  };

  const config = getErrorConfig();

  return (
    <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4`}>
      <div className="flex items-center gap-2 mb-2">
        {config.icon}
        <p className={`font-medium ${config.titleColor}`}>{config.title}</p>
      </div>
      <p className={`text-sm ${config.textColor} mb-3`}>
        {config.description}
      </p>
      <RetryAnalysisButton 
        callId={callId}
        currentStatus={callStatus}
        onRetrySuccess={onRetrySuccess}
      />
    </div>
  );
};
