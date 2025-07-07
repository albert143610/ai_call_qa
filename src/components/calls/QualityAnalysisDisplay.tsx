
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, MessageSquare, AlertTriangle } from 'lucide-react';
import { QualityAnalysisLoadingState } from './LoadingStates';
import { RetryAnalysisButton } from './RetryAnalysisButton';
import type { Tables } from '@/integrations/supabase/types';

type QualityScore = Tables<'quality_scores'>;

interface QualityAnalysisDisplayProps {
  qualityScore?: QualityScore;
  isAnalyzing: boolean;
  callStatus: string;
  callId: string;
  onRetrySuccess?: () => void;
}

const getSentimentColor = (sentiment: string) => {
  const colors = {
    positive: 'bg-green-100 text-green-800 border-green-200',
    neutral: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    negative: 'bg-red-100 text-red-800 border-red-200',
  };
  return colors[sentiment as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
};

const getScoreColor = (score: number) => {
  if (score >= 4) return 'text-green-600 bg-green-50';
  if (score >= 3) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
};

export const QualityAnalysisDisplay = ({ 
  qualityScore, 
  isAnalyzing, 
  callStatus,
  callId,
  onRetrySuccess
}: QualityAnalysisDisplayProps) => {
  const isStuckAnalyzing = callStatus === 'analyzing' && !qualityScore;
  
  return (
    <div className="space-y-4">
      <h4 className="font-semibold flex items-center gap-2">
        <BarChart3 className="h-4 w-4" />
        Quality Analysis
      </h4>
      
      {qualityScore ? (
        <div className="space-y-4">
          {/* Overall Score - More prominent */}
          {qualityScore.overall_satisfaction_score && (
            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Overall Score</span>
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-lg font-bold px-3 py-1 ${getScoreColor(qualityScore.overall_satisfaction_score)}`}
                >
                  {qualityScore.overall_satisfaction_score}/5
                </Badge>
              </div>
            </div>
          )}
          
          {/* Detailed Scores - Better grid layout */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {qualityScore.communication_score && (
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-gray-700">Communication</span>
                <span className={`font-medium px-2 py-1 rounded ${getScoreColor(qualityScore.communication_score)}`}>
                  {qualityScore.communication_score}/5
                </span>
              </div>
            )}
            {qualityScore.problem_resolution_score && (
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-gray-700">Resolution</span>
                <span className={`font-medium px-2 py-1 rounded ${getScoreColor(qualityScore.problem_resolution_score)}`}>
                  {qualityScore.problem_resolution_score}/5
                </span>
              </div>
            )}
            {qualityScore.professionalism_score && (
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-gray-700">Professionalism</span>
                <span className={`font-medium px-2 py-1 rounded ${getScoreColor(qualityScore.professionalism_score)}`}>
                  {qualityScore.professionalism_score}/5
                </span>
              </div>
            )}
            {qualityScore.empathy_score && (
              <div className="flex justify-between items-center gap-2 p-2 bg-gray-50 rounded">
                <span className="text-gray-700">Empathy</span>
                <span className={`font-medium px-2 py-1 rounded ${getScoreColor(qualityScore.empathy_score)}`}>
                  {qualityScore.empathy_score}/5
                </span>
              </div>
            )}
          </div>
          
          {/* Sentiment with better styling */}
          {qualityScore.sentiment && (
            <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
              <span className="font-medium text-gray-700">Sentiment</span>
              <Badge className={`capitalize ${getSentimentColor(qualityScore.sentiment)}`}>
                {qualityScore.sentiment}
              </Badge>
            </div>
          )}
          
          {/* AI Feedback - Much better presentation */}
          {qualityScore.ai_feedback && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <p className="font-medium text-blue-800">AI Feedback</p>
              </div>
              <div className="text-sm text-blue-900 leading-relaxed max-h-32 overflow-y-auto">
                {qualityScore.ai_feedback}
              </div>
            </div>
          )}

          {/* Manual Review Status */}
          {qualityScore.manual_review_required && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="font-medium text-yellow-800 mb-2">Manual Review Required</p>
              <p className="text-sm text-yellow-700">Status: <span className="font-medium">{qualityScore.manual_review_status}</span></p>
              {qualityScore.manual_review_notes && (
                <p className="text-sm text-yellow-700 mt-2">{qualityScore.manual_review_notes}</p>
              )}
            </div>
          )}
          
          {/* Improvement Areas */}
          {qualityScore.improvement_areas && qualityScore.improvement_areas.length > 0 && (
            <div className="space-y-2">
              <p className="font-medium text-gray-700">Improvement Areas</p>
              <div className="flex flex-wrap gap-2">
                {qualityScore.improvement_areas.map((area, index) => (
                  <Badge key={index} variant="secondary" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : isAnalyzing ? (
        <QualityAnalysisLoadingState />
      ) : isStuckAnalyzing ? (
        <div className="space-y-3">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <p className="font-medium text-yellow-800">Analysis Taking Longer Than Expected</p>
            </div>
            <p className="text-sm text-yellow-700 mb-3">
              The quality analysis seems to be stuck. You can try restarting the analysis process.
            </p>
            <RetryAnalysisButton 
              callId={callId}
              currentStatus={callStatus}
              onRetrySuccess={onRetrySuccess}
            />
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-sm">
          {callStatus === 'uploaded' ? 'Waiting for transcription to complete' : 'No quality analysis available'}
        </p>
      )}
    </div>
  );
};
