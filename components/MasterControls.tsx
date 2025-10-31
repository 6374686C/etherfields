import React from 'react';
import { VolumeUpIcon, VolumeOffIcon } from './Icons';

interface MasterControlsProps {
  isMuted: boolean;
  onToggleMute: () => void;
}

const MasterControls: React.FC<MasterControlsProps> = ({ isMuted, onToggleMute }) => {
  return (
    <div className="flex justify-center items-center mt-10">
      <button 
        onClick={onToggleMute}
        className="shine-hover p-4 bg-white/5 backdrop-blur-md rounded-full text-white hover:bg-white/15 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-white/50 ring-1 ring-inset ring-white/20 hover:ring-white/30"
        aria-label={isMuted ? "Unmute all audio" : "Mute all audio"}
      >
        {isMuted ? <VolumeOffIcon className="w-8 h-8" /> : <VolumeUpIcon className="w-8 h-8" />}
      </button>
    </div>
  );
};

export default MasterControls;