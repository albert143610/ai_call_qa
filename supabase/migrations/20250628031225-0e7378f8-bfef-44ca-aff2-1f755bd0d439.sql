
-- Extend the calls table with additional fields for better tracking
ALTER TABLE public.calls 
ADD COLUMN IF NOT EXISTS call_source TEXT,
ADD COLUMN IF NOT EXISTS agent_name TEXT,
ADD COLUMN IF NOT EXISTS customer_phone TEXT,
ADD COLUMN IF NOT EXISTS call_type TEXT DEFAULT 'inbound',
ADD COLUMN IF NOT EXISTS department TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_calls_call_source ON public.calls(call_source);
CREATE INDEX IF NOT EXISTS idx_calls_agent_name ON public.calls(agent_name);
CREATE INDEX IF NOT EXISTS idx_calls_call_type ON public.calls(call_type);
CREATE INDEX IF NOT EXISTS idx_calls_status ON public.calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON public.calls(created_at);

-- Update quality_scores table to include structured checklist and more detailed scoring
ALTER TABLE public.quality_scores 
ADD COLUMN IF NOT EXISTS communication_score INTEGER CHECK (communication_score >= 1 AND communication_score <= 5),
ADD COLUMN IF NOT EXISTS problem_resolution_score INTEGER CHECK (problem_resolution_score >= 1 AND problem_resolution_score <= 5),
ADD COLUMN IF NOT EXISTS professionalism_score INTEGER CHECK (professionalism_score >= 1 AND professionalism_score <= 5),
ADD COLUMN IF NOT EXISTS empathy_score INTEGER CHECK (empathy_score >= 1 AND empathy_score <= 5),
ADD COLUMN IF NOT EXISTS follow_up_score INTEGER CHECK (follow_up_score >= 1 AND follow_up_score <= 5),
ADD COLUMN IF NOT EXISTS overall_satisfaction_score INTEGER CHECK (overall_satisfaction_score >= 1 AND overall_satisfaction_score <= 5),
ADD COLUMN IF NOT EXISTS flags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS improvement_areas TEXT[];

-- Create a new table for call tags/categories
CREATE TABLE IF NOT EXISTS public.call_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID REFERENCES public.calls(id) ON DELETE CASCADE NOT NULL,
    tag TEXT NOT NULL,
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on call_tags
ALTER TABLE public.call_tags ENABLE ROW LEVEL SECURITY;

-- RLS policies for call_tags
CREATE POLICY "Users can view tags of their calls" ON public.call_tags
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.calls WHERE calls.id = call_tags.call_id AND calls.user_id = auth.uid()
    ));

CREATE POLICY "System can insert call tags" ON public.call_tags
    FOR INSERT WITH CHECK (true);

-- Create function to extract audio duration (placeholder for future implementation)
CREATE OR REPLACE FUNCTION public.extract_audio_duration(file_path TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- This is a placeholder function that would integrate with audio processing
    -- For now, we'll estimate based on file size or use default values
    -- In a real implementation, this would use audio processing libraries
    RETURN 120; -- Default 2 minutes
END;
$$;

-- Add a function to automatically calculate overall score
CREATE OR REPLACE FUNCTION public.calculate_overall_score(
    communication INTEGER,
    problem_resolution INTEGER,
    professionalism INTEGER,
    empathy INTEGER,
    follow_up INTEGER
) RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    -- Calculate weighted average (you can adjust weights as needed)
    RETURN ROUND(
        (COALESCE(communication, 3) * 0.25 + 
         COALESCE(problem_resolution, 3) * 0.30 + 
         COALESCE(professionalism, 3) * 0.20 + 
         COALESCE(empathy, 3) * 0.15 + 
         COALESCE(follow_up, 3) * 0.10)
    );
END;
$$;

-- Add trigger to automatically update overall score
CREATE OR REPLACE FUNCTION public.update_overall_score()
RETURNS TRIGGER AS $$
BEGIN
    NEW.overall_satisfaction_score := public.calculate_overall_score(
        NEW.communication_score,
        NEW.problem_resolution_score,
        NEW.professionalism_score,
        NEW.empathy_score,
        NEW.follow_up_score
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_overall_score
    BEFORE INSERT OR UPDATE ON public.quality_scores
    FOR EACH ROW
    EXECUTE FUNCTION public.update_overall_score();
