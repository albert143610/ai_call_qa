
import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

export interface AudioPlayerCoreRef {
  seekTo: (time: number) => void;
  play: () => Promise<void>;
  pause: () => void;
  getCurrentTime: () => number;
}

interface AudioPlayerCoreProps {
  src: string;
  onTimeUpdate?: (currentTime: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onDurationChange?: (duration: number) => void;
  onLoadingChange?: (isLoading: boolean) => void;
  onErrorChange?: (error: string | null) => void;
  externalIsPlaying?: boolean;
}

export const AudioPlayerCore = forwardRef<AudioPlayerCoreRef, AudioPlayerCoreProps>(({
  src,
  onTimeUpdate,
  onPlayStateChange,
  onDurationChange,
  onLoadingChange,
  onErrorChange,
  externalIsPlaying
}, ref) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [internalIsPlaying, setInternalIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audioSrc, setAudioSrc] = useState(src);

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
        const errorMsg = 'Failed to play audio';
        setError(errorMsg);
        onErrorChange?.(errorMsg);
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
      onLoadingChange?.(true);
      onErrorChange?.(null);
      onPlayStateChange?.(false);
    }
  }, [src, audioSrc, onLoadingChange, onErrorChange, onPlayStateChange]);

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
      const newDuration = audio.duration || 0;
      setDuration(newDuration);
      setIsLoading(false);
      setError(null);
      onDurationChange?.(newDuration);
      onLoadingChange?.(false);
      onErrorChange?.(null);
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
      onLoadingChange?.(true);
      onErrorChange?.(null);
    };
    
    const handleCanPlay = () => {
      console.log('Audio can play');
      setIsLoading(false);
      setError(null);
      onLoadingChange?.(false);
      onErrorChange?.(null);
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
      onErrorChange?.(userFriendlyError);
      onLoadingChange?.(false);
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
  }, [audioSrc, onTimeUpdate, onPlayStateChange, onDurationChange, onLoadingChange, onErrorChange]);

  // Sync external playing state with audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || error) return;

    if (externalIsPlaying !== undefined) {
      if (externalIsPlaying && audio.paused) {
        console.log('External state says play, but audio is paused - starting playback');
        audio.play().catch(err => {
          console.error('Error playing audio from external state:', err);
          const errorMsg = 'Failed to play audio';
          setError(errorMsg);
          onErrorChange?.(errorMsg);
        });
      } else if (!externalIsPlaying && !audio.paused) {
        console.log('External state says pause, but audio is playing - pausing playback');
        audio.pause();
      }
    }
  }, [externalIsPlaying, error, onErrorChange]);

  return (
    <audio 
      ref={audioRef} 
      preload="metadata"
      crossOrigin="anonymous"
    />
  );
});

AudioPlayerCore.displayName = 'AudioPlayerCore';
