
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, AlertCircle } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  title?: string;
}

export const AudioPlayer = ({ src, title }: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    console.log('Loading audio from:', src);

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      console.log('Audio duration loaded:', audio.duration);
      setDuration(audio.duration);
      setIsLoading(false);
      setError(null);
    };
    const handleEnded = () => setIsPlaying(false);
    const handleLoadStart = () => {
      console.log('Audio load started');
      setIsLoading(true);
      setError(null);
    };
    const handleCanPlayThrough = () => {
      console.log('Audio can play through');
      setIsLoading(false);
      setError(null);
    };
    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      const audioElement = e.target as HTMLAudioElement;
      const errorCode = audioElement.error?.code;
      const errorMessage = audioElement.error?.message;
      console.error('Audio error code:', errorCode, 'message:', errorMessage);
      
      let userFriendlyError = 'Failed to load audio';
      if (errorCode === 1) userFriendlyError = 'Audio loading aborted';
      else if (errorCode === 2) userFriendlyError = 'Network error loading audio';
      else if (errorCode === 3) userFriendlyError = 'Audio decoding error';
      else if (errorCode === 4) userFriendlyError = 'Audio format not supported';
      
      setError(userFriendlyError);
      setIsLoading(false);
    };
    const handleLoadedData = () => {
      console.log('Audio data loaded');
      setIsLoading(false);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('error', handleError);

    // Set crossOrigin to handle CORS issues with Supabase
    audio.crossOrigin = 'anonymous';
    
    // Force load the audio
    audio.load();

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.removeEventListener('error', handleError);
    };
  }, [src]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || error) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        console.log('Attempting to play audio');
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setError('Failed to play audio');
    }
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio || error) return;
    
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newVolume = value[0];
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio || error) return;
    
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Audio Error</span>
        </div>
        <p className="text-sm text-red-600 mt-1">{error}</p>
        <p className="text-xs text-red-500 mt-1">Audio URL: {src}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-4 space-y-4">
      <audio 
        ref={audioRef} 
        src={src} 
        preload="metadata"
        crossOrigin="anonymous"
      />
      
      {title && <h4 className="font-medium text-sm text-gray-900">{title}</h4>}
      
      {/* Progress Bar */}
      <div className="space-y-2">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={1}
          onValueChange={handleSeek}
          className="w-full"
          disabled={isLoading || !!error}
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => skip(-15)}
            disabled={isLoading || !!error}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={togglePlay}
            disabled={isLoading || !!error}
            className="w-12 h-8"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => skip(15)}
            disabled={isLoading || !!error}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMute}
            className="p-1"
            disabled={!!error}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.1}
            onValueChange={handleVolumeChange}
            className="w-20"
            disabled={!!error}
          />
        </div>
      </div>
      
      {isLoading && (
        <div className="text-xs text-gray-500 text-center">
          Loading audio... ({src})
        </div>
      )}
    </div>
  );
};
