import React from 'react';
import { ALL_SOUND_LAYERS } from '../constants';

interface LayerEditorProps {
  activeThemeLayers: string[];
  onAddLayer: (layerId: string) => void;
  onReset: () => void;
}

const LayerEditor: React.FC<LayerEditorProps> = ({ activeThemeLayers, onAddLayer, onReset }) => {
  const availableLayers = ALL_SOUND_LAYERS.filter(layer => !activeThemeLayers.includes(layer.id));

  return (
    <div className="border-t border-white/20 mt-6 pt-6 animate-fade-in-slow">
        <style>{`.animate-fade-in-slow { animation: fade-in 0.4s ease-out forwards; } @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }`}</style>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white/90">Customize Layers</h3>
        <button 
            onClick={onReset}
            className="shine-hover px-4 py-2 text-sm font-semibold bg-white/5 backdrop-blur-md text-white rounded-xl hover:bg-white/15 transition-colors ring-1 ring-inset ring-white/20 hover:ring-white/30"
        >
            Reset to Default
        </button>
      </div>
      <div className="p-4 bg-black/20 rounded-xl">
        <p className="text-white/70 mb-3 text-center">Click to add a new sound layer:</p>
        <div className="flex flex-wrap justify-center gap-3">
          {availableLayers.map(layer => (
            <button
              key={layer.id}
              onClick={() => onAddLayer(layer.id)}
              className="shine-hover flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md rounded-xl hover:bg-white/15 transition-colors ring-1 ring-inset ring-white/20 hover:ring-white/30"
            >
              <i className={`${layer.icon} text-lg w-5 text-center`} />
              <span>{layer.name}</span>
            </button>
          ))}
          {availableLayers.length === 0 && (
            <p className="text-white/50 italic">All available layers have been added.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LayerEditor;