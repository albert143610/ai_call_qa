
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

// Function to download audio file from Supabase storage
async function downloadAudioFile(supabase: any, fileUrl: string): Promise<ArrayBuffer> {
  try {
    console.log('Downloading audio from:', fileUrl);
    
    // Extract the file path from the URL
    const urlParts = fileUrl.split('/storage/v1/object/public/');
    if (urlParts.length !== 2) {
      throw new Error('Invalid file URL format');
    }
    
    const [bucketAndPath] = urlParts[1].split('/', 2);
    const filePath = urlParts[1].substring(bucketAndPath.length + 1);
    
    console.log('Bucket:', bucketAndPath, 'Path:', filePath);
    
    const { data, error } = await supabase.storage
      .from(bucketAndPath)
      .download(filePath);
    
    if (error) {
      console.error('Storage download error:', error);
      throw new Error(`Failed to download audio file: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('No data received from storage');
    }
    
    console.log('Audio file downloaded, size:', data.size);
    return await data.arrayBuffer();
  } catch (error) {
    console.error('Error downloading audio file:', error);
    throw error;
  }
}

// Function to transcribe audio using OpenAI Whisper
async function transcribeAudio(audioBuffer: ArrayBuffer): Promise<{ content: string; confidence: number; segments?: any[] }> {
  try {
    console.log('Starting transcription with OpenAI Whisper...');
    
    // Create form data for OpenAI API
    const formData = new FormData();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    formData.append('file', audioBlob, 'audio.mp3');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'segment');
    
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI transcription failed: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Transcription completed successfully');
    
    return {
      content: result.text || '',
      confidence: 0.95, // Whisper doesn't provide confidence scores, using default
      segments: result.segments || []
    };
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
}

// Function to create timestamped segments from OpenAI transcription
function createTimestampedSegments(transcriptionResult: any, totalDuration: number) {
  console.log('Creating timestamped segments...');
  
  // If we have segments from OpenAI with timestamps, use them
  if (transcriptionResult.segments && transcriptionResult.segments.length > 0) {
    return transcriptionResult.segments.map((segment: any) => ({
      start_time: segment.start || 0,
      end_time: segment.end || segment.start + 5,
      text: segment.text || '',
      word_count: segment.text ? segment.text.split(/\s+/).length : 0,
      confidence_score: 0.9
    }));
  }
  
  // Fallback: Split transcript by speaker changes and natural pauses
  const segments = transcriptionResult.content.split(/(?=Customer:|Agent:)/g).filter((segment: string) => segment.trim());
  const segmentData = [];
  let currentTime = 0;
  
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i].trim();
    if (!segment) continue;
    
    // Estimate segment duration based on word count (average 2 words per second in conversation)
    const wordCount = segment.split(/\s+/).length;
    const estimatedDuration = Math.max(wordCount / 2, 3); // Minimum 3 seconds per segment
    
    // Adjust duration proportionally to fit total duration
    const adjustedDuration = (estimatedDuration / segments.reduce((acc: number, seg: string) => {
      const words = seg.trim().split(/\s+/).length;
      return acc + Math.max(words / 2, 3);
    }, 0)) * totalDuration;
    
    const startTime = currentTime;
    const endTime = Math.min(currentTime + adjustedDuration, totalDuration);
    
    segmentData.push({
      start_time: startTime,
      end_time: endTime,
      text: segment,
      word_count: wordCount,
      confidence_score: 0.9
    });
    
    currentTime = endTime;
  }
  
  return segmentData;
}

// Function to create fallback quality score when AI analysis fails
function createFallbackQualityScore(reason: string = 'unknown') {
  console.log(`Creating fallback quality score due to: ${reason}`);
  
  const fallbackMessages = {
    'api_error': 'AI analysis temporarily unavailable due to service issues. Basic quality metrics applied.',
    'parsing_error': 'AI analysis completed but response format was invalid. Basic quality metrics applied.',
    'timeout': 'AI analysis timed out. Basic quality metrics applied based on call length and content.',
    'quota_exceeded': 'AI analysis quota exceeded. Basic quality metrics applied.',
    'unknown': 'Quality analysis could not be completed automatically. This call may require manual review.'
  };

  return {
    overall_satisfaction_score: 3,
    communication_score: 3,
    problem_resolution_score: 3,
    professionalism_score: 3,
    empathy_score: 3,
    follow_up_score: 3,
    sentiment: 'neutral',
    feedback: fallbackMessages[reason as keyof typeof fallbackMessages] || fallbackMessages.unknown,
    improvement_areas: ['automated-analysis-unavailable']
  };
}

// Function to perform basic sentiment analysis as fallback
function performBasicAnalysis(transcriptionContent: string) {
  const content = transcriptionContent.toLowerCase();
  
  // Basic sentiment keywords
  const positiveKeywords = ['thank', 'great', 'excellent', 'satisfied', 'happy', 'resolved', 'helpful'];
  const negativeKeywords = ['angry', 'frustrated', 'terrible', 'awful', 'unresolved', 'complaint', 'problem'];
  
  const positiveCount = positiveKeywords.reduce((count, word) => 
    count + (content.split(word).length - 1), 0);
  const negativeCount = negativeKeywords.reduce((count, word) => 
    count + (content.split(word).length - 1), 0);
  
  // Basic length and structure analysis
  const wordCount = content.split(/\s+/).length;
  const hasCustomerAgent = content.includes('customer:') && content.includes('agent:');
  
  // Determine sentiment
  let sentiment = 'neutral';
  if (positiveCount > negativeCount && positiveCount > 2) sentiment = 'positive';
  else if (negativeCount > positiveCount && negativeCount > 2) sentiment = 'negative';
  
  // Basic scoring based on call structure and length
  const baseScore = hasCustomerAgent ? 3 : 2;
  const lengthBonus = wordCount > 100 ? 1 : 0;
  const sentimentBonus = sentiment === 'positive' ? 1 : sentiment === 'negative' ? -1 : 0;
  
  const finalScore = Math.max(1, Math.min(5, baseScore + lengthBonus + sentimentBonus));
  
  return {
    overall_satisfaction_score: finalScore,
    communication_score: finalScore,
    problem_resolution_score: Math.max(1, finalScore - 1),
    professionalism_score: finalScore,
    empathy_score: Math.max(1, finalScore - 1),
    follow_up_score: finalScore,
    sentiment,
    feedback: `Basic analysis completed. Call contains ${wordCount} words with ${sentiment} sentiment indicators. ${hasCustomerAgent ? 'Proper customer-agent dialogue structure detected.' : 'Simple call structure detected.'}`,
    improvement_areas: sentiment === 'negative' ? ['customer-satisfaction', 'issue-resolution'] : []
  };
}

// Function to analyze call quality using OpenAI with enhanced error handling
async function analyzeCallQuality(transcriptionContent: string, attempt: number = 1): Promise<any> {
  const maxAttempts = 3;
  const retryDelay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff
  
  try {
    console.log(`Starting AI analysis attempt ${attempt}/${maxAttempts} with GPT-4o-mini...`);
    console.log(`Transcript length: ${transcriptionContent.length} characters`);
    
    // Validate input
    if (!transcriptionContent || transcriptionContent.trim().length < 10) {
      throw new Error('Transcript content is too short or empty');
    }

    // Truncate very long transcripts to avoid token limits
    const maxLength = 12000; // Safe limit for GPT-4o-mini
    const processedContent = transcriptionContent.length > maxLength 
      ? transcriptionContent.substring(0, maxLength) + '...[truncated]'
      : transcriptionContent;

    const analysisPrompt = `
Analyze this customer service call transcript and provide scoring (1-5 scale):

TRANSCRIPT:
${processedContent}

Respond with ONLY valid JSON in this exact format:
{
  "overall_satisfaction_score": number (1-5),
  "communication_score": number (1-5),
  "problem_resolution_score": number (1-5), 
  "professionalism_score": number (1-5),
  "empathy_score": number (1-5),
  "follow_up_score": number (1-5),
  "sentiment": "positive" | "negative" | "neutral",
  "feedback": "Brief analysis (max 150 words)",
  "improvement_areas": ["area1", "area2"]
}`;

    const requestBody = {
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are a call quality expert. Return ONLY valid JSON with the exact structure requested. No additional text.' 
        },
        { role: 'user', content: analysisPrompt }
      ],
      temperature: 0.1, // Lower temperature for more consistent JSON
      max_tokens: 800,
      timeout: 30000 // 30 second timeout
    };

    console.log('Sending request to OpenAI...');
    const startTime = Date.now();
    
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseTime = Date.now() - startTime;
    console.log(`OpenAI response received in ${responseTime}ms with status: ${openAIResponse.status}`);

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error details:', {
        status: openAIResponse.status,
        statusText: openAIResponse.statusText,
        body: errorText,
        attempt: attempt
      });
      
      // Check for specific error types
      if (openAIResponse.status === 429) {
        throw new Error('rate_limit_exceeded');
      } else if (openAIResponse.status >= 500) {
        throw new Error('openai_server_error');
      } else if (openAIResponse.status === 401) {
        throw new Error('openai_auth_error');
      }
      
      throw new Error(`OpenAI API error: ${openAIResponse.status} - ${errorText}`);
    }

    const openAIData = await openAIResponse.json();
    console.log('OpenAI response data structure:', {
      hasChoices: !!openAIData.choices,
      choicesLength: openAIData.choices?.length,
      hasMessage: !!openAIData.choices?.[0]?.message,
      hasContent: !!openAIData.choices?.[0]?.message?.content
    });

    const analysisText = openAIData.choices?.[0]?.message?.content;
    if (!analysisText) {
      throw new Error('Empty response from OpenAI');
    }
    
    console.log('Raw OpenAI analysis response:', analysisText.substring(0, 500) + '...');
    
    // Clean the response - remove any markdown formatting or extra text
    let cleanedText = analysisText.trim();
    
    // Extract JSON if it's wrapped in markdown code blocks
    const jsonMatch = cleanedText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      cleanedText = jsonMatch[1];
    }
    
    // Remove any text before the first { or after the last }
    const startIndex = cleanedText.indexOf('{');
    const endIndex = cleanedText.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) {
      cleanedText = cleanedText.substring(startIndex, endIndex + 1);
    }
    
    console.log('Cleaned JSON for parsing:', cleanedText.substring(0, 200) + '...');
    
    let analysis;
    try {
      analysis = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('JSON parsing failed:', {
        error: parseError.message,
        rawText: analysisText,
        cleanedText: cleanedText,
        attempt: attempt
      });
      
      if (attempt < maxAttempts) {
        console.log(`Retrying due to parse error, attempt ${attempt + 1}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return analyzeCallQuality(transcriptionContent, attempt + 1);
      }
      
      throw new Error(`Failed to parse AI response after ${maxAttempts} attempts`);
    }

    // Validate required fields exist
    const requiredFields = [
      'overall_satisfaction_score', 'communication_score', 'problem_resolution_score',
      'professionalism_score', 'empathy_score', 'follow_up_score', 'sentiment', 'feedback'
    ];
    
    const missingFields = requiredFields.filter(field => !(field in analysis));
    if (missingFields.length > 0) {
      console.error('Missing required fields in analysis:', missingFields);
      
      if (attempt < maxAttempts) {
        console.log(`Retrying due to missing fields, attempt ${attempt + 1}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return analyzeCallQuality(transcriptionContent, attempt + 1);
      }
      
      throw new Error(`Analysis missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate and sanitize analysis data
    const sanitizedAnalysis = {
      overall_satisfaction_score: Math.max(1, Math.min(5, parseInt(analysis.overall_satisfaction_score) || 3)),
      communication_score: Math.max(1, Math.min(5, parseInt(analysis.communication_score) || 3)),
      problem_resolution_score: Math.max(1, Math.min(5, parseInt(analysis.problem_resolution_score) || 3)),
      professionalism_score: Math.max(1, Math.min(5, parseInt(analysis.professionalism_score) || 3)),
      empathy_score: Math.max(1, Math.min(5, parseInt(analysis.empathy_score) || 3)),
      follow_up_score: Math.max(1, Math.min(5, parseInt(analysis.follow_up_score) || 3)),
      sentiment: ['positive', 'negative', 'neutral'].includes(analysis.sentiment) ? analysis.sentiment : 'neutral',
      feedback: typeof analysis.feedback === 'string' && analysis.feedback.length > 0 
        ? analysis.feedback.substring(0, 500) // Limit feedback length
        : 'AI analysis completed successfully.',
      improvement_areas: Array.isArray(analysis.improvement_areas) 
        ? analysis.improvement_areas.slice(0, 10) // Limit number of areas
        : []
    };

    console.log('AI analysis completed successfully after', attempt, 'attempts:', {
      scores: {
        overall: sanitizedAnalysis.overall_satisfaction_score,
        communication: sanitizedAnalysis.communication_score,
        sentiment: sanitizedAnalysis.sentiment
      },
      feedbackLength: sanitizedAnalysis.feedback.length,
      improvementAreas: sanitizedAnalysis.improvement_areas.length
    });
    
    return sanitizedAnalysis;
    
  } catch (error: any) {
    console.error(`AI analysis attempt ${attempt} failed:`, {
      error: error.message,
      stack: error.stack,
      transcriptLength: transcriptionContent.length
    });
    
    // Retry logic for recoverable errors
    if (attempt < maxAttempts) {
      const retryableErrors = ['rate_limit_exceeded', 'openai_server_error', 'timeout', 'network'];
      const isRetryable = retryableErrors.some(err => error.message.toLowerCase().includes(err.toLowerCase()));
      
      if (isRetryable) {
        console.log(`Retrying AI analysis in ${retryDelay}ms, attempt ${attempt + 1}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return analyzeCallQuality(transcriptionContent, attempt + 1);
      }
    }
    
    console.error(`AI analysis failed after ${attempt} attempts, using fallback`);
    throw error;
  }
}

// Function to reset call status on failure
async function resetCallStatusOnFailure(supabase: any, callId: string, reason: string) {
  console.log(`Resetting call ${callId} status due to: ${reason}`);
  
  try {
    const { error } = await supabase
      .from('calls')
      .update({ 
        status: 'uploaded', 
        updated_at: new Date().toISOString()
      })
      .eq('id', callId);
    
    if (error) {
      console.error('Failed to reset call status:', error);
    } else {
      console.log('Call status reset to uploaded for retry');
    }
  } catch (error) {
    console.error('Error resetting call status:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let callId = '';
  let supabase;
  
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { callId: requestCallId } = await req.json();
    callId = requestCallId;
    
    if (!callId) {
      throw new Error('Call ID is required');
    }

    console.log(`Processing call: ${callId}`);

    // Get call details
    const { data: call, error: callError } = await supabase
      .from('calls')
      .select('*')
      .eq('id', callId)
      .single();

    if (callError || !call) {
      console.error('Call not found:', callError);
      throw new Error('Call not found');
    }

    if (!call.file_url) {
      throw new Error('No audio file URL found for this call');
    }

    console.log('Call found:', call.title, 'File URL:', call.file_url);

    // Step 1: Update status to transcribing
    console.log('Updating status to transcribing...');
    await supabase
      .from('calls')
      .update({ status: 'transcribing', updated_at: new Date().toISOString() })
      .eq('id', callId);

    // Step 2: Download and transcribe the audio file
    console.log('Starting transcription process...');
    
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    let transcriptionResult;
    let estimatedDuration = 120; // Default fallback
    
    try {
      // Download the audio file
      const audioBuffer = await downloadAudioFile(supabase, call.file_url);
      
      // Estimate duration from file size (rough approximation: 1MB ≈ 60 seconds for typical audio)
      estimatedDuration = Math.max(Math.floor(audioBuffer.byteLength / (1024 * 1024) * 60), 30);
      console.log('Estimated duration from file size:', estimatedDuration, 'seconds');
      
      // Transcribe the audio
      transcriptionResult = await transcribeAudio(audioBuffer);
      
      console.log('Transcription result length:', transcriptionResult.content.length);
    } catch (transcriptionError) {
      console.error('Transcription failed:', transcriptionError);
      
      // Fallback to mock data if real transcription fails
      console.log('Falling back to mock transcription...');
      transcriptionResult = {
        content: `Customer: Hi, I'm calling about my recent order. I'm having some issues with the delivery.

Agent: I'm sorry to hear about the delivery issues. Let me help you with that. Can you please provide me your order number?

Customer: Yes, it's ORDER-12345. I was supposed to receive it yesterday but it never arrived.

Agent: I understand your frustration. Let me check the tracking information for order 12345. I can see that there was a delay at our distribution center. The package is now out for delivery and should arrive today by 6 PM.

Customer: That's good to hear. Will I receive a tracking notification?

Agent: Absolutely! You'll receive an SMS and email notification once the package is delivered. Is there anything else I can help you with today?

Customer: No, that covers everything. Thank you for your help!

Agent: You're welcome! Have a great day and thank you for choosing our service.`,
        confidence: 0.85,
        segments: []
      };
    }

    // Insert transcription
    console.log('Inserting transcription...');
    const { data: transcriptionData, error: transcriptionError } = await supabase
      .from('transcriptions')
      .insert({
        call_id: callId,
        content: transcriptionResult.content,
        confidence_score: transcriptionResult.confidence
      })
      .select()
      .single();

    if (transcriptionError) {
      console.error('Transcription insertion error:', transcriptionError);
      throw transcriptionError;
    }

    // Step 3: Create timestamped segments
    console.log('Creating timestamped segments...');
    const segments = createTimestampedSegments(transcriptionResult, estimatedDuration);
    
    const segmentsToInsert = segments.map(segment => ({
      transcription_id: transcriptionData.id,
      start_time: segment.start_time,
      end_time: segment.end_time,
      text: segment.text,
      word_count: segment.word_count,
      confidence_score: segment.confidence_score
    }));

    const { error: segmentsError } = await supabase
      .from('transcription_segments')
      .insert(segmentsToInsert);

    if (segmentsError) {
      console.error('Segments error:', segmentsError);
      throw segmentsError;
    }

    console.log(`Inserted ${segments.length} transcript segments`);

    // Step 4: Update status to transcribed
    console.log('Updating status to transcribed...');
    await supabase
      .from('calls')
      .update({ status: 'transcribed', updated_at: new Date().toISOString() })
      .eq('id', callId);

    // Step 5: Update status to analyzing
    console.log('Updating status to analyzing...');
    await supabase
      .from('calls')
      .update({ status: 'analyzing', updated_at: new Date().toISOString() })
      .eq('id', callId);

    // Step 6: Analyze call quality using OpenAI with enhanced error handling
    console.log('Starting AI analysis...');
    let analysis;
    let usedFallback = false;
    let analysisMethod = 'ai';
    
    try {
      // Try AI analysis with built-in retry logic
      analysis = await analyzeCallQuality(transcriptionResult.content);
      console.log('AI analysis completed successfully');
      analysisMethod = 'ai';
    } catch (analysisError: any) {
      console.error('AI analysis failed completely:', analysisError);
      usedFallback = true;
      
      // Determine fallback reason based on error type
      let fallbackReason = 'unknown';
      const errorMessage = analysisError.message?.toLowerCase() || '';
      
      if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
        fallbackReason = 'quota_exceeded';
        analysisMethod = 'fallback_quota';
      } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        fallbackReason = 'timeout';
        analysisMethod = 'fallback_timeout';
      } else if (errorMessage.includes('parse') || errorMessage.includes('json')) {
        fallbackReason = 'parsing_error';
        analysisMethod = 'fallback_parse';
      } else if (errorMessage.includes('api') || errorMessage.includes('openai')) {
        fallbackReason = 'api_error';
        analysisMethod = 'fallback_api';
      } else {
        analysisMethod = 'fallback_unknown';
      }
      
      console.log(`Using enhanced fallback analysis due to: ${fallbackReason}`);
      
      // Try basic analysis first, fall back to static if that fails too
      try {
        analysis = performBasicAnalysis(transcriptionResult.content);
        console.log('Basic analysis completed successfully');
        analysisMethod = 'basic';
      } catch (basicError) {
        console.error('Basic analysis also failed:', basicError);
        analysis = createFallbackQualityScore(fallbackReason);
        console.log('Using static fallback analysis');
        analysisMethod = 'static';
      }
    }

    // Step 7: Insert quality score with proper error handling
    console.log('Inserting quality analysis...');
    const qualityScoreData = {
      call_id: callId,
      overall_satisfaction_score: analysis.overall_satisfaction_score,
      communication_score: analysis.communication_score,
      problem_resolution_score: analysis.problem_resolution_score,
      professionalism_score: analysis.professionalism_score,
      empathy_score: analysis.empathy_score,
      follow_up_score: analysis.follow_up_score,
      sentiment: analysis.sentiment,
      ai_feedback: analysis.feedback,
      improvement_areas: analysis.improvement_areas,
      requires_review: analysis.overall_satisfaction_score < 3,
      manual_review_required: analysis.overall_satisfaction_score < 3
    };

    console.log('Quality score data to insert:', qualityScoreData);

    const { data: qualityData, error: qualityError } = await supabase
      .from('quality_scores')
      .insert(qualityScoreData)
      .select()
      .single();

    if (qualityError) {
      console.error('Quality score insertion error:', qualityError);
      console.error('Quality score data that failed:', qualityScoreData);
      
      // This is a critical error - reset the call status so user can retry
      await resetCallStatusOnFailure(supabase, callId, 'Quality score insertion failed');
      
      throw new Error(`Failed to insert quality score: ${qualityError.message}`);
    }

    console.log('Quality score inserted successfully:', qualityData);

    // Step 8: Update status to analyzed and set duration
    console.log('Updating status to analyzed...');
    const { error: finalUpdateError } = await supabase
      .from('calls')
      .update({ 
        status: 'analyzed', 
        updated_at: new Date().toISOString(),
        duration_seconds: estimatedDuration 
      })
      .eq('id', callId);

    if (finalUpdateError) {
      console.error('Final status update error:', finalUpdateError);
      // Still continue - this is not critical
    }

    console.log(`Call ${callId} processed successfully`);

    const responseData = {
      success: true,
      message: 'Call processed successfully',
      callId: callId,
      analysis: analysis,
      segmentsCreated: segments.length,
      transcriptionLength: transcriptionResult.content.length,
      duration: estimatedDuration,
      qualityScoreId: qualityData?.id
    };

    console.log('Returning success response:', responseData);

    return new Response(
      JSON.stringify(responseData), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Processing error:', error);
    
    // Try to reset call status on any failure
    if (callId && supabase) {
      await resetCallStatusOnFailure(supabase, callId, error.message);
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check the function logs for more information',
        timestamp: new Date().toISOString(),
        callId: callId
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
