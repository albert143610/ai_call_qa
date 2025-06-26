
-- Create tables for the AI call QA system

-- Create enum for call status
CREATE TYPE call_status AS ENUM ('uploaded', 'transcribing', 'transcribed', 'analyzing', 'analyzed', 'reviewed');

-- Create enum for sentiment
CREATE TYPE sentiment_type AS ENUM ('positive', 'negative', 'neutral');

-- Create calls table
CREATE TABLE public.calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    file_url TEXT,
    file_name TEXT,
    duration_seconds INTEGER,
    status call_status DEFAULT 'uploaded',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transcriptions table
CREATE TABLE public.transcriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID REFERENCES public.calls(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quality_scores table
CREATE TABLE public.quality_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID REFERENCES public.calls(id) ON DELETE CASCADE NOT NULL,
    ai_score INTEGER CHECK (ai_score >= 1 AND ai_score <= 5),
    human_score INTEGER CHECK (human_score >= 1 AND human_score <= 5),
    sentiment sentiment_type,
    ai_feedback TEXT,
    human_feedback TEXT,
    quality_checklist JSONB,
    requires_review BOOLEAN DEFAULT TRUE,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calls
CREATE POLICY "Users can view their own calls" ON public.calls
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calls" ON public.calls
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calls" ON public.calls
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calls" ON public.calls
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for transcriptions
CREATE POLICY "Users can view transcriptions of their calls" ON public.transcriptions
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.calls WHERE calls.id = transcriptions.call_id AND calls.user_id = auth.uid()
    ));

CREATE POLICY "System can insert transcriptions" ON public.transcriptions
    FOR INSERT WITH CHECK (true);

-- RLS Policies for quality_scores
CREATE POLICY "Users can view quality scores of their calls" ON public.quality_scores
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.calls WHERE calls.id = quality_scores.call_id AND calls.user_id = auth.uid()
    ));

CREATE POLICY "System can insert quality scores" ON public.quality_scores
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update quality scores of their calls" ON public.quality_scores
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM public.calls WHERE calls.id = quality_scores.call_id AND calls.user_id = auth.uid()
    ));

-- Create storage bucket for call recordings
INSERT INTO storage.buckets (id, name, public) VALUES ('call-recordings', 'call-recordings', false);

-- Storage policies
CREATE POLICY "Users can upload their own call recordings" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'call-recordings' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own call recordings" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'call-recordings' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own call recordings" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'call-recordings' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );
