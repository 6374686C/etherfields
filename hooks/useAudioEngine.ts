import { useState, useRef, useCallback, useEffect } from 'react';
import { Theme, SoundLayer } from '../types';
import { FADE_TIME, ALL_SOUND_LAYERS } from '../constants';

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
  
  // State for Layers (Web Audio API)
  const layerPlayersRef = useRef<Map<string, LoopingPlayer>>(new Map());
  const layerAudioBuffersRef = useRef<Map<string, AudioBuffer>>(new Map());
  
  // State for Themes (HTML5 Audio streaming via Web Audio API)
  const themeAudioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const themeGainNodesRef = useRef<Map<string, GainNode>>(new Map());

  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioState, setAudioState] = useState<AudioState>(AudioState.Suspended);
  const [activeThemeId, setActiveThemeId] = useState(initialThemeId);
  const [currentVolumes, setCurrentVolumes] = useState(initialVolumes);

  const cleanupAudio = useCallback(() => {
    // Cleanup layers
    layerPlayersRef.current.forEach(player => {
        player.stop();
        player.disconnect();
    });
    layerPlayersRef.current.clear();
    layerAudioBuffersRef.current.clear();

    // Cleanup themes
    themeAudioElementsRef.current.forEach(audioEl => {
        audioEl.pause();
        audioEl.src = '';
    });
    themeAudioElementsRef.current.clear();
    themeGainNodesRef.current.clear();

    // Cleanup context
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
    const oldThemeGain = themeGainNodesRef.current.get(activeThemeId);
    if (oldThemeGain) {
        oldThemeGain.gain.cancelScheduledValues(currentTime);
        oldThemeGain.gain.setValueAtTime(oldThemeGain.gain.value, currentTime);
        oldThemeGain.gain.linearRampToValueAtTime(0.0, fadeEndTime);
    }
    
    // Fade in new theme
    const newThemeGain = themeGainNodesRef.current.get(themeId);
    if (newThemeGain) {
        newThemeGain.gain.cancelScheduledValues(currentTime);
        newThemeGain.gain.setValueAtTime(0.0, currentTime);
        newThemeGain.gain.linearRampToValueAtTime(targetVolume, fadeEndTime);
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
        
        // --- 1. Set up Themes for streaming ---
        themes.forEach(theme => {
            const audioEl = new Audio(theme.audioSrc);
            audioEl.crossOrigin = "anonymous";
            audioEl.loop = true;
            themeAudioElementsRef.current.set(theme.id, audioEl);

            const sourceNode = context.createMediaElementSource(audioEl);
            const gainNode = context.createGain();
            
            const initialGain = theme.id === initialThemeId ? initialMainVolume : 0;
            gainNode.gain.value = initialGain;

            sourceNode.connect(gainNode).connect(masterGain);
            themeGainNodesRef.current.set(theme.id, gainNode);
        });
        
        // --- 2. Load Layers into memory for seamless looping ---
        const loadPromises = allLayers.map(layer => 
            fetch(layer.audioSrc)
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    return response.arrayBuffer();
                })
                .then(buffer => context.decodeAudioData(buffer))
                .then(decodedData => {
                    layerAudioBuffersRef.current.set(layer.id, decodedData);
                })
                .catch(err => {
                    console.warn(`Could not load or decode audio for "${layer.name}" from ${layer.audioSrc}. Using a silent placeholder. Error:`, err);
                    const silentBuffer = createSilentAudioBuffer(context, 2);
                    layerAudioBuffersRef.current.set(layer.id, silentBuffer);
                })
        );
        
        await Promise.all(loadPromises);

        // --- 3. Create Layer Players ---
        allLayers.forEach(layer => {
            const buffer = layerAudioBuffersRef.current.get(layer.id);
            if (!buffer) return;

            const initialGainValue = currentVolumes[layer.id] ?? 0;
            const player = new LoopingPlayer(context, buffer, initialGainValue);
            player.connect(masterGain);
            player.start();
            layerPlayersRef.current.set(layer.id, player);
        });

        // --- 4. Start Playback ---
        // Start all theme audio elements. Only the active one has volume.
        // FIX: Add explicit type annotation for 'el' to resolve a TypeScript inference issue.
        const playPromises = Array.from(themeAudioElementsRef.current.values()).map((el: HTMLAudioElement) => el.play());
        await Promise.all(playPromises).catch(e => console.warn("Some themes could not be autoplayed:", e));

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
    const player = layerPlayersRef.current.get(layerId);
    if (!context || !player) return;

    player.gain.cancelScheduledValues(context.currentTime);
    player.gain.setValueAtTime(player.gain.value, context.currentTime);
    player.gain.linearRampToValueAtTime(volume, context.currentTime + duration);
    setCurrentVolumes(prev => ({ ...prev, [layerId]: volume }));
  }, []);

  const setMainVolume = useCallback((volume: number, duration: number = 0.1, themeIdToTarget?: string) => {
    const context = audioContextRef.current;
    const targetId = themeIdToTarget || activeThemeId;
    const themeGain = themeGainNodesRef.current.get(targetId);
    if (!context || !themeGain) return;

    themeGain.gain.cancelScheduledValues(context.currentTime);
    themeGain.gain.setValueAtTime(themeGain.gain.value, context.currentTime);
    themeGain.gain.linearRampToValueAtTime(volume, context.currentTime + duration);
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

	const resetAndPlayTheme = useCallback((
		newThemeAudioId: string, 
		newLayers: string[], 
		newMainVolume: number, 
		newLayerVolumes: Record<string, number>
	) => {
		const context = audioContextRef.current;
		const masterGain = masterGainRef.current;
		if (!context || !masterGain) return;

		const fadeOutDuration = 0.5;
		const fadeInDuration = 1.5;

		// 1. Fade out master volume to silence everything
		masterGain.gain.cancelScheduledValues(context.currentTime);
		masterGain.gain.setValueAtTime(masterGain.gain.value, context.currentTime);
		masterGain.gain.linearRampToValueAtTime(0.0, context.currentTime + fadeOutDuration);

		// 2. After fade out, reconfigure audio sources and then fade back in
		setTimeout(() => {
			if (context.state === 'closed') return;

			// --- Reconfigure Themes ---
			themeGainNodesRef.current.forEach((gainNode, themeId) => {
				gainNode.gain.cancelScheduledValues(context.currentTime);
				const targetVolume = themeId === newThemeAudioId ? newMainVolume : 0;
				gainNode.gain.setValueAtTime(targetVolume, context.currentTime);
			});
			
			// --- Reconfigure Layers ---
			layerPlayersRef.current.forEach((player, layerId) => {
				player.gain.cancelScheduledValues(context.currentTime);
				const targetVolume = newLayers.includes(layerId) ? (newLayerVolumes[layerId] ?? 0.5) : 0;
				player.gain.setValueAtTime(targetVolume, context.currentTime);
			});
			
			// Update internal state to match new reality
			setCurrentVolumes(prev => ({ ...prev, ...newLayerVolumes }));
			setActiveThemeId(newThemeAudioId);

			// 3. Fade master volume back in
			masterGain.gain.linearRampToValueAtTime(1.0, context.currentTime + fadeInDuration);

		}, fadeOutDuration * 1000);
	}, []);

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
    resetAndPlayTheme,
  };
};