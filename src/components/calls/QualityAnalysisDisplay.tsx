
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, MessageSquare } from 'lucide-react';
import { QualityAnalysisLoadingState } from './LoadingStates';
import { AnalysisErrorState } from './AnalysisErrorState';
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
  // Determine the state of the analysis
  const isCurrentlyAnalyzing = callStatus === 'analyzing';
  const isStuckAnalyzing = callStatus === 'analyzing' && !qualityScore;
  const isAnalyzedButNoData = callStatus === 'analyzed' && !qualityScore;
  const hasValidAnalysis = qualityScore && callStatus === 'analyzed';
  
  // Check if this is a fallback analysis (basic analysis due to AI failure)
  const isFallbackAnalysis = qualityScore?.improvement_areas?.includes('automated-analysis-unavailable');
  const hasBasicAnalysis = qualityScore && !isFallbackAnalysis;
  
  // Determine analysis quality for UI feedback
  const getAnalysisQuality = () => {
    if (!qualityScore) return 'none';
    if (isFallbackAnalysis) return 'basic';
    
    // Check for AI feedback quality
    const hasMeaningfulFeedback = qualityScore.ai_feedback && 
      qualityScore.ai_feedback.length > 50 &&
      !qualityScore.ai_feedback.includes('Analysis completed successfully') &&
      !qualityScore.ai_feedback.includes('Basic analysis completed');
    
    if (hasMeaningfulFeedback) return 'detailed';
    
    // Check if scores look realistic (not all the same)
    const scores = [
      qualityScore.communication_score,
      qualityScore.problem_resolution_score,
      qualityScore.professionalism_score,
      qualityScore.empathy_score
    ].filter(Boolean);
    
    const hasVariedScores = scores.length > 1 && new Set(scores).size > 1;
    return hasVariedScores ? 'standard' : 'basic';
  };
  
  const analysisQuality = getAnalysisQuality();
  
  return (
    <div className="space-y-4">
      <h4 className="font-semibold flex items-center gap-2">
        <BarChart3 className="h-4 w-4" />
        Quality Analysis
      </h4>
      
      {hasValidAnalysis ? (
        <div className="space-y-4">
          {/* Analysis Quality Indicator */}
          {analysisQuality === 'basic' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-orange-800">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm font-medium">Basic Analysis Mode</span>
              </div>
              <p className="text-xs text-orange-700 mt-1">
                Advanced AI analysis was not available. Scores are based on call structure, length, and keyword analysis.
              </p>
            </div>
          )}
          
          {analysisQuality === 'detailed' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-800">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm font-medium">AI-Enhanced Analysis</span>
              </div>
              <p className="text-xs text-green-700 mt-1">
                Comprehensive AI analysis with detailed feedback and insights.
              </p>
            </div>
          )}
          
          {/* Overall Score - More prominent */}
          {qualityScore.overall_satisfaction_score && (
            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Overall Score</span>
                  {analysisQuality === 'detailed' && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      AI Enhanced
                    </Badge>
                  )}
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
                {qualityScore.improvement_areas
                  .filter(area => area !== 'automated-analysis-unavailable') // Filter out technical markers
                  .map((area, index) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                      {area.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </div>
      ) : isCurrentlyAnalyzing ? (
        <QualityAnalysisLoadingState />
      ) : isAnalyzedButNoData ? (
        <AnalysisErrorState
          callId={callId}
          callStatus={callStatus}
          errorType="failed"
          onRetrySuccess={onRetrySuccess}
        />
      ) : isStuckAnalyzing ? (
        <AnalysisErrorState
          callId={callId}
          callStatus={callStatus}
          errorType="stuck"
          onRetrySuccess={onRetrySuccess}
        />
      ) : (
        <p className="text-gray-500 text-sm">
          {callStatus === 'uploaded' ? 'Waiting for transcription to complete' : 'No quality analysis available'}
        </p>
      )}
    </div>
  );
};
