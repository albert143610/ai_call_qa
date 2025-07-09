
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
          description: 'The AI analysis could not be completed. The system will try alternative analysis methods when you retry.',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-700',
          titleColor: 'text-red-800'
        };
      case 'stuck':
        return {
          icon: <RefreshCw className="h-4 w-4 text-yellow-600 animate-spin" />,
          title: 'Analysis Taking Longer Than Expected',
          description: 'The AI analysis is taking longer than usual. This may be due to high server load or network issues.',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-700',
          titleColor: 'text-yellow-800'
        };
      case 'incomplete':
        return {
          icon: <FileText className="h-4 w-4 text-orange-600" />,
          title: 'Partial Analysis Available',
          description: 'Basic analysis was completed but detailed AI insights may be limited. Quality scores are still available.',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-700',
          titleColor: 'text-orange-800'
        };
      default:
        return {
          icon: <AlertTriangle className="h-4 w-4 text-gray-600" />,
          title: 'Analysis Issue',
          description: 'There was an issue with the analysis process. Please try again or contact support if the problem persists.',
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
