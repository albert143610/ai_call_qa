
-- Check if policies exist and only create missing ones
DO $$
BEGIN
    -- Add missing RLS policies only if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'transcriptions' 
        AND policyname = 'Users can view transcriptions of their calls'
    ) THEN
        CREATE POLICY "Users can view transcriptions of their calls" ON public.transcriptions
            FOR SELECT USING (EXISTS (
                SELECT 1 FROM public.calls WHERE calls.id = transcriptions.call_id AND calls.user_id = auth.uid()
            ));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'transcriptions' 
        AND policyname = 'System can insert transcriptions'
    ) THEN
        CREATE POLICY "System can insert transcriptions" ON public.transcriptions
            FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'quality_scores' 
        AND policyname = 'Users can view quality scores of their calls'
    ) THEN
        CREATE POLICY "Users can view quality scores of their calls" ON public.quality_scores
            FOR SELECT USING (EXISTS (
                SELECT 1 FROM public.calls WHERE calls.id = quality_scores.call_id AND calls.user_id = auth.uid()
            ));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'quality_scores' 
        AND policyname = 'System can insert quality scores'
    ) THEN
        CREATE POLICY "System can insert quality scores" ON public.quality_scores
            FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'quality_scores' 
        AND policyname = 'Users can update quality scores of their calls'
    ) THEN
        CREATE POLICY "Users can update quality scores of their calls" ON public.quality_scores
            FOR UPDATE USING (EXISTS (
                SELECT 1 FROM public.calls WHERE calls.id = quality_scores.call_id AND calls.user_id = auth.uid()
            ));
    END IF;
END $$;

-- Create storage bucket for call recordings (only if it doesn't exist)
INSERT INTO storage.buckets (id, name, public) VALUES ('call-recordings', 'call-recordings', false)
ON CONFLICT (id) DO NOTHING;

-- Check if storage policies exist and only create missing ones
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' 
        AND policyname = 'Users can upload their own call recordings'
    ) THEN
        CREATE POLICY "Users can upload their own call recordings" ON storage.objects
            FOR INSERT WITH CHECK (
                bucket_id = 'call-recordings' AND 
                auth.uid()::text = (storage.foldername(name))[1]
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' 
        AND policyname = 'Users can view their own call recordings'
    ) THEN
        CREATE POLICY "Users can view their own call recordings" ON storage.objects
            FOR SELECT USING (
                bucket_id = 'call-recordings' AND 
                auth.uid()::text = (storage.foldername(name))[1]
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' 
        AND policyname = 'Users can delete their own call recordings'
    ) THEN
        CREATE POLICY "Users can delete their own call recordings" ON storage.objects
            FOR DELETE USING (
                bucket_id = 'call-recordings' AND 
                auth.uid()::text = (storage.foldername(name))[1]
            );
    END IF;
END $$;

-- Create function to trigger call processing
CREATE OR REPLACE FUNCTION public.trigger_call_processing()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger processing for newly uploaded calls
    IF NEW.status = 'uploaded' AND (OLD IS NULL OR OLD.status != 'uploaded') THEN
        -- Call the edge function asynchronously using the service role key
        PERFORM
            net.http_post(
                url := 'https://qrojijxeggmyivzovkjc.supabase.co/functions/v1/process-call',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyb2ppanhlZ2dteWl2em92a2pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5OTkzMzksImV4cCI6MjA1ODU3NTMzOX0.xvs-rQow79646MOPuUttyMvyeT4dpGUYTuLpJSJL6Uc'
                ),
                body := jsonb_build_object('callId', NEW.id::text)
            );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically process calls after upload
DROP TRIGGER IF EXISTS trigger_process_call ON public.calls;
CREATE TRIGGER trigger_process_call
    AFTER INSERT OR UPDATE ON public.calls
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_call_processing();
