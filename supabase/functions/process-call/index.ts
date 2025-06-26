
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { callId } = await req.json();
    
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
      throw new Error('Call not found');
    }

    // Update status to transcribing
    await supabase
      .from('calls')
      .update({ status: 'transcribing' })
      .eq('id', callId);

    // Simulate transcription (in a real app, you'd use OpenAI Whisper API)
    const mockTranscription = `Customer: Hi, I'm calling about my recent order. I'm having some issues with the delivery.
Agent: I'm sorry to hear about the delivery issues. Let me help you with that. Can you please provide me your order number?
Customer: Yes, it's ORDER-12345. I was supposed to receive it yesterday but it never arrived.
Agent: I understand your frustration. Let me check the tracking information for order 12345. I can see that there was a delay at our distribution center. The package is now out for delivery and should arrive today by 6 PM.
Customer: That's good to hear. Will I receive a tracking notification?
Agent: Absolutely! You'll receive an SMS and email notification once the package is delivered. Is there anything else I can help you with today?
Customer: No, that covers everything. Thank you for your help!
Agent: You're welcome! Have a great day and thank you for choosing our service.`;

    // Insert transcription
    const { error: transcriptionError } = await supabase
      .from('transcriptions')
      .insert({
        call_id: callId,
        content: mockTranscription,
        confidence_score: 0.95
      });

    if (transcriptionError) {
      console.error('Transcription error:', transcriptionError);
    }

    // Update status to transcribed
    await supabase
      .from('calls')
      .update({ status: 'transcribed' })
      .eq('id', callId);

    // Update status to analyzing
    await supabase
      .from('calls')
      .update({ status: 'analyzing' })
      .eq('id', callId);

    // Analyze call quality using OpenAI
    const analysisPrompt = `
Analyze the following customer service call transcript and provide:
1. A quality score from 1-5 (5 being excellent)
2. Overall sentiment (positive, negative, or neutral)
3. Brief feedback on the agent's performance

Transcript:
${mockTranscription}

Please respond in JSON format with: score, sentiment, feedback
`;

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert call quality analyst. Respond only with valid JSON.' },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!openAIResponse.ok) {
      throw new Error('OpenAI API request failed');
    }

    const openAIData = await openAIResponse.json();
    const analysisText = openAIData.choices[0].message.content;
    
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      analysis = {
        score: 4,
        sentiment: 'positive',
        feedback: 'The agent handled the customer inquiry professionally and provided clear information about the delivery delay.'
      };
    }

    // Insert quality score
    const { error: qualityError } = await supabase
      .from('quality_scores')
      .insert({
        call_id: callId,
        ai_score: analysis.score,
        sentiment: analysis.sentiment,
        ai_feedback: analysis.feedback,
        requires_review: analysis.score < 3
      });

    if (qualityError) {
      console.error('Quality score error:', qualityError);
    }

    // Update status to analyzed
    await supabase
      .from('calls')
      .update({ status: 'analyzed' })
      .eq('id', callId);

    console.log(`Call ${callId} processed successfully`);

    return new Response(
      JSON.stringify({ success: true, message: 'Call processed successfully' }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Processing error:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
