
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
      const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/mpeg'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload an audio file (MP3, WAV, or M4A).",
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
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('call-recordings')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('call-recordings')
        .getPublicUrl(filePath);

      // Create call record
      const { error: insertError } = await supabase
        .from('calls')
        .insert({
          user_id: user.id,
          title: title.trim(),
          file_url: publicUrl,
          file_name: file.name,
          status: 'uploaded'
        });

      if (insertError) throw insertError;

      toast({
        title: "Upload successful!",
        description: "Your call has been uploaded and will be processed shortly.",
      });

      // Reset form
      setTitle('');
      setFile(null);
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      onUploadComplete();
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
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
          Upload an audio file to analyze call quality and sentiment
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
            <p className="text-sm text-gray-600">
              Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
          <Button type="submit" disabled={uploading || !file || !title.trim()} className="w-full">
            {uploading ? 'Uploading...' : 'Upload Call'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
