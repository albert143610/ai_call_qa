
-- Create table for storing timestamped transcript segments
CREATE TABLE public.transcription_segments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transcription_id uuid NOT NULL,
  start_time numeric NOT NULL, -- Start time in seconds
  end_time numeric NOT NULL,   -- End time in seconds
  text text NOT NULL,
  word_count integer,
  confidence_score numeric,
  created_at timestamp with time zone DEFAULT now()
);

-- Add foreign key constraint
ALTER TABLE public.transcription_segments 
ADD CONSTRAINT fk_transcription_segments_transcription_id 
FOREIGN KEY (transcription_id) REFERENCES public.transcriptions(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.transcription_segments ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for users to view segments of their calls
CREATE POLICY "Users can view segments of their calls" 
ON public.transcription_segments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.transcriptions t
    JOIN public.calls c ON c.id = t.call_id
    WHERE t.id = transcription_segments.transcription_id 
    AND c.user_id = auth.uid()
  )
);

-- Create RLS policy for system to insert segments
CREATE POLICY "System can insert transcription segments" 
ON public.transcription_segments 
FOR INSERT 
WITH CHECK (true);

-- Add index for performance
CREATE INDEX idx_transcription_segments_transcription_id ON public.transcription_segments(transcription_id);
CREATE INDEX idx_transcription_segments_time_range ON public.transcription_segments(start_time, end_time);
