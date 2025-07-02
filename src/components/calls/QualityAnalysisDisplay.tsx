
import { Badge } from '@/components/ui/badge';
import { BarChart3 } from 'lucide-react';
import { QualityAnalysisLoadingState } from './LoadingStates';
import type { Tables } from '@/integrations/supabase/types';

type QualityScore = Tables<'quality_scores'>;

interface QualityAnalysisDisplayProps {
  qualityScore?: QualityScore;
  isAnalyzing: boolean;
  callStatus: string;
}

const getSentimentColor = (sentiment: string) => {
  const colors = {
    positive: 'bg-green-100 text-green-800',
    neutral: 'bg-yellow-100 text-yellow-800',
    negative: 'bg-red-100 text-red-800',
  };
  return colors[sentiment as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

export const QualityAnalysisDisplay = ({ 
  qualityScore, 
  isAnalyzing, 
  callStatus 
}: QualityAnalysisDisplayProps) => {
  return (
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

          {/* Manual Review Status */}
          {qualityScore.manual_review_required && (
            <div className="bg-yellow-50 p-2 rounded text-sm border border-yellow-200">
              <p className="font-medium text-yellow-800">Manual Review Required</p>
              <p className="text-yellow-700">Status: {qualityScore.manual_review_status}</p>
              {qualityScore.manual_review_notes && (
                <p className="text-yellow-700 mt-1">{qualityScore.manual_review_notes}</p>
              )}
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
      ) : isAnalyzing ? (
        <QualityAnalysisLoadingState />
      ) : (
        <p className="text-gray-500 text-sm">
          {callStatus === 'uploaded' ? 'Waiting for transcription to complete' : 'No quality analysis available'}
        </p>
      )}
    </div>
  );
};
