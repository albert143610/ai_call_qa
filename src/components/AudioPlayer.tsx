
import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { AudioPlayerCore, AudioPlayerCoreRef } from './audio/AudioPlayerCore';
import { AudioControls } from './audio/AudioControls';
import { AudioProgressBar } from './audio/AudioProgressBar';
import { AudioVolumeControl } from './audio/AudioVolumeControl';
import { AudioPlayerError } from './audio/AudioPlayerError';

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
  const coreRef = useRef<AudioPlayerCoreRef>(null);
  const audioElementRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use external playing state if provided, otherwise use internal state
  const playingState = externalIsPlaying !== undefined ? externalIsPlaying : isPlaying;

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    seekTo: (time: number) => {
      if (coreRef.current) {
        coreRef.current.seekTo(time);
      }
    },
    play: async () => {
      if (coreRef.current) {
        await coreRef.current.play();
      }
    },
    pause: () => {
      if (coreRef.current) {
        coreRef.current.pause();
      }
    },
    getCurrentTime: () => {
      return coreRef.current ? coreRef.current.getCurrentTime() : 0;
    }
  }));

  // Expose seek function to parent
  useEffect(() => {
    if (onSeekTo) {
      const seekHandler = (time: number) => {
        if (coreRef.current && !error) {
          coreRef.current.seekTo(time);
        }
      };
      onSeekTo.current = seekHandler;
    }
  }, [onSeekTo, error]);

  // Get reference to the actual audio element for volume control
  useEffect(() => {
    // This is a bit of a hack to get the audio element from the core component
    // In a real implementation, you might pass the audio element ref through props
    const audioElements = document.querySelectorAll('audio');
    if (audioElements.length > 0) {
      audioElementRef.current = audioElements[audioElements.length - 1] as HTMLAudioElement;
    }
  }, []);

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
    onTimeUpdate?.(time);
  };

  const handlePlayStateChange = (playing: boolean) => {
    setIsPlaying(playing);
    onPlayStateChange?.(playing);
  };

  const handleTogglePlay = async () => {
    if (!coreRef.current || error) return;

    try {
      if (playingState) {
        console.log('Pausing audio');
        coreRef.current.pause();
      } else {
        console.log('Starting audio playback');
        await coreRef.current.play();
      }
    } catch (error) {
      console.error('Error toggling audio playback:', error);
      setError('Failed to play audio');
    }
  };

  const handleSeek = (value: number[]) => {
    if (!coreRef.current || error) return;
    
    const newTime = value[0];
    console.log('Manual seek to:', newTime);
    coreRef.current.seekTo(newTime);
  };

  const handleSkip = (seconds: number) => {
    if (!coreRef.current || error) return;
    
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    console.log('Skipping to time:', newTime);
    coreRef.current.seekTo(newTime);
  };

  const handleRetry = () => {
    console.log('Retrying audio load');
    setError(null);
    setIsLoading(true);
    // The core component will handle reloading
  };

  if (error) {
    return (
      <AudioPlayerError 
        error={error} 
        audioSrc={src} 
        onRetry={handleRetry} 
      />
    );
  }

  return (
    <div className="bg-white border rounded-lg p-4 space-y-4">
      <AudioPlayerCore
        ref={coreRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onPlayStateChange={handlePlayStateChange}
        onDurationChange={setDuration}
        onLoadingChange={setIsLoading}
        onErrorChange={setError}
        externalIsPlaying={externalIsPlaying}
      />
      
      {title && <h4 className="font-medium text-sm text-gray-900">{title}</h4>}
      
      {/* Progress Bar */}
      <AudioProgressBar
        currentTime={currentTime}
        duration={duration}
        isLoading={isLoading}
        hasError={!!error}
        onSeek={handleSeek}
      />

      {/* Controls */}
      <div className="flex items-center justify-between">
        <AudioControls
          isPlaying={playingState}
          isLoading={isLoading}
          hasError={!!error}
          onTogglePlay={handleTogglePlay}
          onSkip={handleSkip}
        />

        {/* Volume Control */}
        <AudioVolumeControl
          audioRef={audioElementRef}
          hasError={!!error}
        />
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
