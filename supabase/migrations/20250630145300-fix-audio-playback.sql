
-- Make the call-recordings bucket public so audio files can be accessed via public URLs
UPDATE storage.buckets 
SET public = true 
WHERE id = 'call-recordings';

-- Update RLS policies for the call-recordings bucket to ensure proper access control
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can upload their own call recordings" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own call recordings" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own call recordings" ON storage.objects;

-- Create new policies for the public bucket
CREATE POLICY "Users can upload their own call recordings" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'call-recordings' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Anyone can view call recordings" ON storage.objects
    FOR SELECT USING (bucket_id = 'call-recordings');

CREATE POLICY "Users can delete their own call recordings" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'call-recordings' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );
