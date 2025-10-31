import { useState, useRef, useCallback, useEffect } from 'react';
import { Theme, SoundLayer } from '../types';
import { FADE_TIME } from '../constants';

export enum AudioState {
  Suspended,
  Running,
  Closed,
}

// --- High-Precision Looping Player ---
// This class implements a robust scheduling pattern (often called the "metronome pattern")
// to create seamless audio loops by scheduling playback slightly ahead of time.
// It overcomes the gaps inherent in some audio files (like MP3s) when using `loop=true`.
const OVERLAP_DURATION = 0.1; // 100ms overlap to cover potential gaps

class LoopingPlayer {
  private context: AudioContext;
  private buffer: AudioBuffer;
  private gainNode: GainNode;
  
  private isPlaying = false;
  private nextNoteTime = 0.0;
  private timerId: number | undefined;

  // Scheduling configuration
  private lookahead = 25.0; // How often we wake up to schedule (ms)
  private scheduleAheadTime = 0.1; // How far ahead to schedule audio (s)

  constructor(context: AudioContext, buffer: AudioBuffer, initialGain: number) {
    this.context = context;
    this.buffer = buffer;
    this.gainNode = context.createGain();
    this.gainNode.gain.value = initialGain;
  }

  connect(destination: AudioNode) {
    this.gainNode.connect(destination);
  }

  disconnect() {
    this.gainNode.disconnect();
  }

  get gain() {
      return this.gainNode.gain;
  }

  private scheduler = () => {
    if (!this.isPlaying) return;

    // Schedule notes that will need to play before the next interval
    while (this.nextNoteTime < this.context.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.nextNoteTime);
      this.nextNoteTime += this.buffer.duration - OVERLAP_DURATION;
    }
    
    this.timerId = window.setTimeout(this.scheduler, this.lookahead);
  }

  private scheduleNote = (time: number) => {
    if (!this.isPlaying) return;
    const source = this.context.createBufferSource();
    source.buffer = this.buffer;
    source.connect(this.gainNode);
    source.start(time);
  }

  start() {
    if (this.isPlaying || this.buffer.duration <= OVERLAP_DURATION) return;
    this.isPlaying = true;
    this.nextNoteTime = this.context.currentTime + 0.1; // Start with a small delay
    this.scheduler();
  }

  stop() {
    this.isPlaying = false;
    if (this.timerId) {
      window.clearTimeout(this.timerId);
      this.timerId = undefined;
    }
  }
}

// --- End of Looping Player ---


interface UseAudioEngineProps {
  themes: Theme[];
  allLayers: SoundLayer[];
  initialThemeId: string;
  initialVolumes: Record<string, number>;
  initialMainVolume: number;
}

// Helper to create a silent audio buffer as a fallback
const createSilentAudioBuffer = (context: AudioContext, duration: number): AudioBuffer => {
    const sampleRate = context.sampleRate;
    const frameCount = sampleRate * duration;
    const buffer = context.createBuffer(1, frameCount, sampleRate);
    return buffer;
};

export const useAudioEngine = ({ themes, allLayers, initialThemeId, initialVolumes, initialMainVolume }: UseAudioEngineProps) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const playersRef = useRef<Map<string, LoopingPlayer>>(new Map());
  const audioBuffersRef = useRef<Map<string, AudioBuffer>>(new Map());

  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioState, setAudioState] = useState<AudioState>(AudioState.Suspended);
  const [activeThemeId, setActiveThemeId] = useState(initialThemeId);
  const [currentVolumes, setCurrentVolumes] = useState(initialVolumes);

  const cleanupAudio = useCallback(() => {
    playersRef.current.forEach(player => {
        player.stop();
        player.disconnect();
    });
    playersRef.current.clear();

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().then(() => {
        setAudioState(AudioState.Closed);
      });
    }
    audioContextRef.current = null;
    masterGainRef.current = null;
    setIsInitialized(false);
  }, []);

  const selectTheme = useCallback((themeId: string, targetVolume: number) => {
    const context = audioContextRef.current;
    if (!context || themeId === activeThemeId) {
        return;
    }
    
    const currentTime = context.currentTime;
    const fadeEndTime = currentTime + FADE_TIME;

    // Fade out old theme
    const oldThemePlayer = playersRef.current.get(activeThemeId);
    if (oldThemePlayer) {
        oldThemePlayer.gain.cancelScheduledValues(currentTime);
        oldThemePlayer.gain.setValueAtTime(oldThemePlayer.gain.value, currentTime);
        oldThemePlayer.gain.linearRampToValueAtTime(0.0, fadeEndTime);
    }
    
    // Fade in new theme
    const newThemePlayer = playersRef.current.get(themeId);
    if (newThemePlayer) {
        newThemePlayer.gain.cancelScheduledValues(currentTime);
        newThemePlayer.gain.setValueAtTime(0.0, currentTime);
        newThemePlayer.gain.linearRampToValueAtTime(targetVolume, fadeEndTime);
    }

    setActiveThemeId(themeId);
  }, [activeThemeId]);

  const initializeAudio = useCallback(async () => {
    if (isInitialized) return;
    
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = context;
    
    setAudioState(context.state as AudioState);
    context.onstatechange = () => setAudioState(context.state as AudioState);

    if (context.state === 'suspended') {
      await context.resume();
    }
    
    setIsLoading(true);

    try {
        const masterGain = context.createGain();
        masterGain.gain.value = 0; // Start silent
        masterGain.connect(context.destination);
        masterGainRef.current = masterGain;
        
        const allAudioAssets = [
            ...themes.map(t => ({ id: t.id, name: t.name, audioSrc: t.audioSrc })),
            ...allLayers
        ];
        
        const loadPromises = allAudioAssets.map(asset => 
            fetch(asset.audioSrc)
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    return response.arrayBuffer();
                })
                .then(buffer => context.decodeAudioData(buffer))
                .then(decodedData => {
                    audioBuffersRef.current.set(asset.id, decodedData);
                })
                .catch(err => {
                    console.warn(`Could not load or decode audio for "${asset.name}" from ${asset.audioSrc}. Using a silent placeholder. Error:`, err);
                    const silentBuffer = createSilentAudioBuffer(context, 2);
                    audioBuffersRef.current.set(asset.id, silentBuffer);
                })
        );
        
        await Promise.all(loadPromises);
        
        allAudioAssets.forEach(asset => {
            const buffer = audioBuffersRef.current.get(asset.id);
            if (!buffer) return;

            const isTheme = themes.some(t => t.id === asset.id);
            let initialGainValue = 0;
            if (isTheme) {
                initialGainValue = asset.id === initialThemeId ? initialMainVolume : 0;
            } else {
                initialGainValue = currentVolumes[asset.id] ?? 0;
            }

            const player = new LoopingPlayer(context, buffer, initialGainValue);
            player.connect(masterGain);
            player.start();
            playersRef.current.set(asset.id, player);
        });

        // Fade in master volume for a smooth start
        masterGain.gain.linearRampToValueAtTime(1.0, context.currentTime + FADE_TIME);
        
    } catch (error) {
        console.error("An unexpected error occurred during audio initialization:", error);
    } finally {
        setIsLoading(false);
        setIsInitialized(true);
    }
  }, [isInitialized, themes, allLayers, initialThemeId, currentVolumes, initialMainVolume]);


  const setLayerVolume = useCallback((layerId: string, volume: number, duration: number = 0.1) => {
    const context = audioContextRef.current;
    const player = playersRef.current.get(layerId);
    if (!context || !player) return;

    player.gain.cancelScheduledValues(context.currentTime);
    player.gain.setValueAtTime(player.gain.value, context.currentTime);
    player.gain.linearRampToValueAtTime(volume, context.currentTime + duration);
    setCurrentVolumes(prev => ({ ...prev, [layerId]: volume }));
  }, []);

  const setMainVolume = useCallback((volume: number, duration: number = 0.1) => {
    const context = audioContextRef.current;
    const player = playersRef.current.get(activeThemeId);
    if (!context || !player) return;

    player.gain.cancelScheduledValues(context.currentTime);
    player.gain.setValueAtTime(player.gain.value, context.currentTime);
    player.gain.linearRampToValueAtTime(volume, context.currentTime + duration);
  }, [activeThemeId]);


  const toggleMute = useCallback(() => {
    const context = audioContextRef.current;
    const masterGain = masterGainRef.current;
    if (!context || !masterGain) return;
    
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    
    const targetVolume = newMuteState ? 0 : 1;
    masterGain.gain.cancelScheduledValues(context.currentTime);
    masterGain.gain.setValueAtTime(masterGain.gain.value, context.currentTime);
    masterGain.gain.linearRampToValueAtTime(targetVolume, context.currentTime + FADE_TIME / 2);

  }, [isMuted]);

  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, [cleanupAudio]);

  return {
    isInitialized,
    isLoading,
    isMuted,
    audioState,
    activeThemeId,
    currentVolumes,
    initializeAudio,
    selectTheme,
    setLayerVolume,
    setMainVolume,
    toggleMute,
  };
};
