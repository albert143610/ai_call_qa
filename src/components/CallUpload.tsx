
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Upload } from 'lucide-react';

interface CallUploadProps {
  onUploadComplete: () => void;
}

export const CallUpload = ({ onUploadComplete }: CallUploadProps) => {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type (audio files)
      const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/mpeg', 'audio/ogg', 'audio/webm'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload an audio file (MP3, WAV, M4A, OGG, or WebM).",
          variant: "destructive",
        });
        return;
      }
      
      // Check file size (limit to 50MB)
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 50MB.",
          variant: "destructive",
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user || !title.trim()) return;

    setUploading(true);
    try {
      console.log('Starting file upload process...');
      
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log('Uploading file to storage:', filePath);
      const { error: uploadError } = await supabase.storage
        .from('call-recordings')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('call-recordings')
        .getPublicUrl(filePath);

      console.log('File uploaded successfully, creating call record...');

      // Create call record - this will trigger the processing automatically
      const { data: callData, error: insertError } = await supabase
        .from('calls')
        .insert({
          user_id: user.id,
          title: title.trim(),
          file_url: publicUrl,
          file_name: file.name,
          status: 'uploaded'
        })
        .select()
        .single();

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw insertError;
      }

      console.log('Call record created successfully:', callData);

      toast({
        title: "Upload successful!",
        description: "Your call has been uploaded and processing will begin shortly.",
      });

      // Reset form
      setTitle('');
      setFile(null);
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      onUploadComplete();
    } catch (error: any) {
      console.error('Upload process failed:', error);
      toast({
        title: "Upload failed",
        description: error.message || "An unexpected error occurred during upload.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Call Recording
        </CardTitle>
        <CardDescription>
          Upload an audio file to analyze call quality and sentiment. Processing will begin automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <Input
              placeholder="Call title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <Input
              id="file-input"
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              required
            />
          </div>
          {file && (
            <div className="text-sm text-gray-600 space-y-1">
              <p>Selected: {file.name}</p>
              <p>Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <p>Type: {file.type}</p>
            </div>
          )}
          <Button type="submit" disabled={uploading || !file || !title.trim()} className="w-full">
            {uploading ? 'Uploading...' : 'Upload Call'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
