import { Theme, SoundLayer } from './types';

const AUDIO_BASE_URL = 'https://6374686c.github.io/etherfields';

export const ALL_SOUND_LAYERS: SoundLayer[] = [
  { id: 'thunder', name: 'Thunder', audioSrc: `${AUDIO_BASE_URL}/audio/layers/thunder.mp3`, icon: 'fa-solid fa-cloud-bolt' },
  { id: 'rain', name: 'Rain', audioSrc: `${AUDIO_BASE_URL}/audio/layers/rain.mp3`, icon: 'fa-solid fa-cloud-showers-heavy' },
  { id: 'forest', name: 'Forest', audioSrc: `${AUDIO_BASE_URL}/audio/layers/forest.mp3`, icon: 'fa-solid fa-tree' },
  { id: 'campfire', name: 'Campfire', audioSrc: `${AUDIO_BASE_URL}/audio/layers/campfire.mp3`, icon: 'fa-solid fa-fire' },
  { id: 'ocean', name: 'Ocean Waves', audioSrc: `${AUDIO_BASE_URL}/audio/layers/ocean.mp3`, icon: 'fa-solid fa-water' },
  { id: 'planets', name: 'Planets', audioSrc: `${AUDIO_BASE_URL}/audio/layers/planets.mp3`, icon: 'fa-solid fa-earth-americas' },
  { id: 'space_debris', name: 'Space Debris', audioSrc: `${AUDIO_BASE_URL}/audio/layers/space_debris.mp3`, icon: 'fa-solid fa-satellite' },
  { id: 'nasa_chatter', name: 'Nasa Chatter', audioSrc: `${AUDIO_BASE_URL}/audio/layers/nasa_chatter.mp3`, icon: 'fa-solid fa-headset' },
  { id: 'wind_chimes', name: 'Wind Chimes', audioSrc: `${AUDIO_BASE_URL}/audio/layers/wind_chimes.mp3`, icon: 'fa-solid fa-bell' },
  { id: 'crickets', name: 'Crickets', audioSrc: `${AUDIO_BASE_URL}/audio/layers/crickets.mp3`, icon: 'fa-solid fa-bug' },
  { id: 'birds', name: 'Birds', audioSrc: `${AUDIO_BASE_URL}/audio/layers/birds.mp3`, icon: 'fa-solid fa-dove' },
  { id: 'whales', name: 'Whales', audioSrc: `${AUDIO_BASE_URL}/audio/layers/whales.mp3`, icon: 'fa-solid fa-fish-fins' },
  { id: 'bubbles', name: 'Bubbles', audioSrc: `${AUDIO_BASE_URL}/audio/layers/bubbles.mp3`, icon: 'fa-solid fa-circle-nodes' },
];


export const THEMES: Theme[] = [
  {
    id: 'dark-drone',
    name: 'Dark Drone',
    audioSrc: `${AUDIO_BASE_URL}/audio/themes/dark_drone.mp3`,
    vantaEffect: 'WAVES',
    layers: ['planets', 'space_debris', 'nasa_chatter'],
    defaultThemeVolume: 0.7,
    defaultVolumes: { planets: 0.3, space_debris: 0.45, nasa_chatter: 0.2 },
  },
  {
    id: 'floating-dreaming',
    name: 'Floating / Dreaming',
    audioSrc: `${AUDIO_BASE_URL}/audio/themes/floating_dreaming.mp3`,
    vantaEffect: 'CLOUDS',
    layers: ['thunder', 'rain', 'forest', 'wind_chimes', 'crickets'],
    defaultThemeVolume: 0.7,
    defaultVolumes: { thunder: 0, rain: 0, forest: 0.3, wind_chimes: 0.15, crickets: 0.3 },
  },
  {
    id: 'focus-meditation',
    name: 'Focus / Meditation',
    audioSrc: `${AUDIO_BASE_URL}/audio/themes/focus_meditation.mp3`,
    vantaEffect: 'HALO',
    layers: ['whales', 'bubbles'],
    defaultThemeVolume: 0.7,
    defaultVolumes: { whales: 0.5, bubbles: 0.7 },
  },
];

export const FADE_TIME = 3.5; // seconds for crossfading