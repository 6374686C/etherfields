import React from 'react';

export interface Theme {
  id: string;
  name: string;
  audioSrc: string;
  vantaEffect: 'WAVES' | 'CLOUDS' | 'HALO' | 'CLOUDS2' | 'FOG';
  layers: string[]; // Array of sound layer IDs
  defaultThemeVolume: number;
  defaultVolumes: Record<string, number>;
}

export interface SoundLayer {
  id: string;
  name: string;
  audioSrc: string;
  icon: string;
}