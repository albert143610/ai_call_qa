
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
          icon: <AlertTriangle className="h-4 w-4 text-red-600" />,
          title: 'Analysis Failed',
          description: 'The call was marked as analyzed but no quality data was found. This usually means the analysis process failed to complete properly.',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-700',
          titleColor: 'text-red-800'
        };
      case 'stuck':
        return {
          icon: <RefreshCw className="h-4 w-4 text-yellow-600 animate-spin" />,
          title: 'Analysis Taking Longer Than Expected',
          description: 'The quality analysis seems to be stuck. You can try restarting the analysis process.',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-700',
          titleColor: 'text-yellow-800'
        };
      case 'incomplete':
        return {
          icon: <FileText className="h-4 w-4 text-orange-600" />,
          title: 'Incomplete Analysis',
          description: 'The analysis started but didn\'t complete successfully. Some data may be missing.',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-700',
          titleColor: 'text-orange-800'
        };
      default:
        return {
          icon: <AlertTriangle className="h-4 w-4 text-gray-600" />,
          title: 'Unknown Error',
          description: 'An unexpected error occurred during analysis.',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-700',
          titleColor: 'text-gray-800'
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
