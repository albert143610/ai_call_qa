import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, AlertCircle } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  title?: string;
  onTimeUpdate?: (currentTime: number) => void;
  onSeekTo?: React.MutableRefObject<((time: number) => void) | null>;
  isPlaying?: boolean;
  onPlayStateChange?: (isPlaying: boolean) => void;
  transcription?: any;
}

export interface AudioPlayerRef {
  seekTo: (time: number) => void;
  play: () => Promise<void>;
  pause: () => void;
  getCurrentTime: () => number;
}

export const AudioPlayer = forwardRef<AudioPlayerRef, AudioPlayerProps>(({ 
  src, 
  title, 
  onTimeUpdate,
  onSeekTo,
  isPlaying: externalIsPlaying,
  onPlayStateChange,
  transcription
}, ref) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [internalIsPlaying, setInternalIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audioSrc, setAudioSrc] = useState(src);

  // Use external playing state if provided, otherwise use internal state
  const isPlaying = externalIsPlaying !== undefined ? externalIsPlaying : internalIsPlaying;

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    seekTo: (time: number) => {
      const audio = audioRef.current;
      if (!audio || error) return;
      
      const seekTime = Math.max(0, Math.min(duration, time));
      console.log('Seeking to time:', seekTime);
      audio.currentTime = seekTime;
      setCurrentTime(seekTime);
      onTimeUpdate?.(seekTime);
    },
    play: async () => {
      const audio = audioRef.current;
      if (!audio || error) return;
      
      try {
        await audio.play();
      } catch (error) {
        console.error('Error playing audio:', error);
        setError('Failed to play audio');
      }
    },
    pause: () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.pause();
    },
    getCurrentTime: () => currentTime
  }));

  // Handle src changes
  useEffect(() => {
    if (src !== audioSrc) {
      console.log('Audio src changed from', audioSrc, 'to', src);
      setAudioSrc(src);
      setIsLoading(true);
      setError(null);
      setCurrentTime(0);
      setDuration(0);
      setInternalIsPlaying(false);
      onPlayStateChange?.(false);
    }
  }, [src, audioSrc, onPlayStateChange]);

  // Setup audio element event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    console.log('Setting up audio element with src:', audioSrc);

    const updateTime = () => {
      const newTime = audio.currentTime;
      setCurrentTime(newTime);
      onTimeUpdate?.(newTime);
    };
    
    const updateDuration = () => {
      console.log('Audio duration loaded:', audio.duration);
      setDuration(audio.duration || 0);
      setIsLoading(false);
      setError(null);
    };
    
    const handleEnded = () => {
      console.log('Audio playback ended');
      setInternalIsPlaying(false);
      onPlayStateChange?.(false);
    };
    
    const handleLoadStart = () => {
      console.log('Audio load started');
      setIsLoading(true);
      setError(null);
    };
    
    const handleCanPlay = () => {
      console.log('Audio can play');
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
      setInternalIsPlaying(false);
      onPlayStateChange?.(false);
    };

    const handlePlay = () => {
      console.log('Audio started playing');
      setInternalIsPlaying(true);
      onPlayStateChange?.(true);
    };

    const handlePause = () => {
      console.log('Audio paused');
      setInternalIsPlaying(false);
      onPlayStateChange?.(false);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    // Only reload if src actually changed
    if (audio.src !== audioSrc) {
      audio.src = audioSrc;
      audio.load();
    }

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [audioSrc, onTimeUpdate, onPlayStateChange]);

  // Sync external playing state with audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || error) return;

    if (externalIsPlaying !== undefined) {
      if (externalIsPlaying && audio.paused) {
        console.log('External state says play, but audio is paused - starting playback');
        audio.play().catch(err => {
          console.error('Error playing audio from external state:', err);
          setError('Failed to play audio');
        });
      } else if (!externalIsPlaying && !audio.paused) {
        console.log('External state says pause, but audio is playing - pausing playback');
        audio.pause();
      }
    }
  }, [externalIsPlaying, error]);

  // Expose seek function to parent
  useEffect(() => {
    if (onSeekTo) {
      const seekHandler = (time: number) => {
        const audio = audioRef.current;
        if (!audio || error) return;
        
        const seekTime = Math.max(0, Math.min(duration, time));
        console.log('Seeking to time:', seekTime);
        audio.currentTime = seekTime;
        setCurrentTime(seekTime);
        onTimeUpdate?.(seekTime);
      };

      onSeekTo.current = seekHandler;
    }
  }, [onSeekTo, duration, error, onTimeUpdate]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || error) return;

    try {
      if (isPlaying) {
        console.log('Pausing audio');
        audio.pause();
      } else {
        console.log('Starting audio playback');
        await audio.play();
      }
    } catch (error) {
      console.error('Error toggling audio playback:', error);
      setError('Failed to play audio');
    }
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio || error) return;
    
    const newTime = value[0];
    console.log('Manual seek to:', newTime);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
    onTimeUpdate?.(newTime);
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
    
    const newTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
    console.log('Skipping to time:', newTime);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
    onTimeUpdate?.(newTime);
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
        <p className="text-xs text-red-500 mt-1">Audio URL: {audioSrc}</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2"
          onClick={() => {
            console.log('Retrying audio load');
            setError(null);
            setIsLoading(true);
            if (audioRef.current) {
              audioRef.current.load();
            }
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-4 space-y-4">
      <audio 
        ref={audioRef} 
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
          Loading audio...
        </div>
      )}
    </div>
  );
});

AudioPlayer.displayName = 'AudioPlayer';
