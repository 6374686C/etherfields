import { useState, useRef, useCallback, useEffect } from 'react';
import { Theme, SoundLayer } from '../types';
import { FADE_TIME } from '../constants';

export enum AudioState {
  Suspended,
  Running,
  Closed,
}

interface AudioNodes {
  sources: Map<string, AudioBufferSourceNode>; // for layers
  gains: Map<string, GainNode>; // for layers
  themePlayers: Map<string, {
    element: HTMLAudioElement;
    source: MediaElementAudioSourceNode;
    gain: GainNode;
  }>;
  masterGain: GainNode;
}

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
    // The buffer is initialized with zeros, creating silence.
    return buffer;
};

export const useAudioEngine = ({ themes, allLayers, initialThemeId, initialVolumes, initialMainVolume }: UseAudioEngineProps) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioNodesRef = useRef<AudioNodes | null>(null);
  const audioBuffersRef = useRef<Map<string, AudioBuffer>>(new Map());

  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioState, setAudioState] = useState<AudioState>(AudioState.Suspended);
  const [activeThemeId, setActiveThemeId] = useState(initialThemeId);
  const [currentVolumes, setCurrentVolumes] = useState(initialVolumes);

  const cleanupAudio = useCallback(() => {
    if (audioNodesRef.current) {
      audioNodesRef.current.themePlayers.forEach(player => {
        player.element.pause();
        player.element.src = ''; // Release resource
      });
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().then(() => {
        setAudioState(AudioState.Closed);
      });
    }
    audioContextRef.current = null;
    audioNodesRef.current = null;
    setIsInitialized(false);
  }, []);

  const playLayer = useCallback((layerId: string) => {
    const context = audioContextRef.current;
    const nodes = audioNodesRef.current;
    const buffer = audioBuffersRef.current.get(layerId);
    if (!context || !nodes || !buffer) return;

    // Stop existing source if it's playing
    if (nodes.sources.has(layerId)) {
        nodes.sources.get(layerId)?.stop();
    }

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    
    const gainNode = nodes.gains.get(layerId);
    if (gainNode) {
        source.connect(gainNode);
    }
    
    source.start(0);
    nodes.sources.set(layerId, source);
  }, []);
  
  const selectTheme = useCallback((themeId: string, targetVolume: number) => {
    const context = audioContextRef.current;
    const nodes = audioNodesRef.current;

    if (!context || !nodes || themeId === activeThemeId) {
        return;
    }
    
    const currentTime = context.currentTime;
    const fadeEndTime = currentTime + FADE_TIME;

    // Fade out old theme
    const oldThemePlayer = nodes.themePlayers.get(activeThemeId);
    if (oldThemePlayer) {
        oldThemePlayer.gain.gain.cancelScheduledValues(currentTime);
        oldThemePlayer.gain.gain.setValueAtTime(oldThemePlayer.gain.gain.value, currentTime);
        oldThemePlayer.gain.gain.linearRampToValueAtTime(0.0, fadeEndTime);
        // Pause the element after it has faded out
        setTimeout(() => {
            if (audioContextRef.current && audioContextRef.current.state === 'running' && oldThemePlayer.element) {
                oldThemePlayer.element.pause();
            }
        }, FADE_TIME * 1000);
    }
    
    // Fade in new theme
    const newThemePlayer = nodes.themePlayers.get(themeId);
    if (newThemePlayer) {
        newThemePlayer.element.play().catch(e => console.error(`Error playing theme ${themeId}:`, e));
        newThemePlayer.gain.gain.cancelScheduledValues(currentTime);
        newThemePlayer.gain.gain.setValueAtTime(0, currentTime);
        newThemePlayer.gain.gain.linearRampToValueAtTime(targetVolume, fadeEndTime);
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
        
        const nodes: AudioNodes = {
            sources: new Map(),
            gains: new Map(),
            themePlayers: new Map(),
            masterGain,
        };
        
        // Initialize Theme Players using streaming <audio> elements
        themes.forEach(theme => {
            const element = new Audio(theme.audioSrc);
            element.crossOrigin = "anonymous";
            element.loop = true;
            
            const sourceNode = context.createMediaElementSource(element);
            const gainNode = context.createGain();
            gainNode.gain.value = theme.id === initialThemeId ? initialMainVolume : 0.0;
            
            sourceNode.connect(gainNode);
            gainNode.connect(masterGain);
            
            nodes.themePlayers.set(theme.id, { element, source: sourceNode, gain: gainNode });
        });

        // Pre-load layer audio files
        const promises = allLayers.map(asset => 
            fetch(asset.audioSrc)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
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
        await Promise.all(promises);
        
        allLayers.forEach(layer => {
            const gainNode = context.createGain();
            gainNode.gain.value = currentVolumes[layer.id] ?? 0;
            gainNode.connect(masterGain);
            nodes.gains.set(layer.id, gainNode);
        });

        audioNodesRef.current = nodes;
                
        allLayers.forEach(layer => {
            playLayer(layer.id);
        });

        // Start playing the initial theme
        const initialThemePlayer = nodes.themePlayers.get(initialThemeId);
        if (initialThemePlayer) {
            await initialThemePlayer.element.play();
        }

        // Fade in master volume for a smooth start
        masterGain.gain.linearRampToValueAtTime(1.0, context.currentTime + FADE_TIME);
        
    } catch (error) {
        console.error("An unexpected error occurred during audio initialization:", error);
    } finally {
        setIsLoading(false);
        setIsInitialized(true);
    }
  }, [isInitialized, themes, allLayers, initialThemeId, currentVolumes, playLayer, initialMainVolume]);


  const setLayerVolume = useCallback((layerId: string, volume: number, duration: number = 0.1) => {
    const context = audioContextRef.current;
    const nodes = audioNodesRef.current;
    if (!context || !nodes) return;

    const gainNode = nodes.gains.get(layerId);
    if (gainNode) {
        gainNode.gain.cancelScheduledValues(context.currentTime);
        gainNode.gain.setValueAtTime(gainNode.gain.value, context.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, context.currentTime + duration);
        setCurrentVolumes(prev => ({ ...prev, [layerId]: volume }));
    }
  }, []);

  const setMainVolume = useCallback((volume: number, duration: number = 0.1) => {
    const context = audioContextRef.current;
    const nodes = audioNodesRef.current;
    if (!context || !nodes) return;

    const themePlayer = nodes.themePlayers.get(activeThemeId);
    if (themePlayer) {
        themePlayer.gain.gain.cancelScheduledValues(context.currentTime);
        themePlayer.gain.gain.setValueAtTime(themePlayer.gain.gain.value, context.currentTime);
        themePlayer.gain.gain.linearRampToValueAtTime(volume, context.currentTime + duration);
    }
  }, [activeThemeId]);


  const toggleMute = useCallback(() => {
    const context = audioContextRef.current;
    const nodes = audioNodesRef.current;
    if (!context || !nodes) return;
    
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    
    const targetVolume = newMuteState ? 0 : 1;
    nodes.masterGain.gain.cancelScheduledValues(context.currentTime);
    nodes.masterGain.gain.setValueAtTime(nodes.masterGain.gain.value, context.currentTime);
    nodes.masterGain.gain.linearRampToValueAtTime(targetVolume, context.currentTime + FADE_TIME / 2);
  }, [isMuted]);

  useEffect(() => {
    return () => cleanupAudio();
  }, [cleanupAudio]);

  return { 
    audioState, 
    isInitialized, 
    isLoading,
    isMuted,
    initializeAudio, 
    selectTheme, 
    setLayerVolume,
    setMainVolume,
    toggleMute,
  };
};