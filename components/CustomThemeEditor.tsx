import React, { useState, useEffect } from 'react';
import { Theme, SoundLayer } from '../types';

const BACKGROUND_OPTIONS: { id: Theme['vantaEffect']; name: string; description: string }[] = [
    { id: 'WAVES', name: 'Cosmic Waves', description: 'Dark, shimmering waves.' },
    { id: 'CLOUDS', name: 'Dream Clouds', description: 'Gentle, colorful clouds.' },
    { id: 'HALO', name: 'Aura Borealis', description: 'Minimalist glowing rings.' },
    { id: 'FOG', name: 'Mystic Fog', description: 'Subtle, flowing mist.' },
];

const THEME_SUBTITLES: Record<string, string> = {
	'dark-drone': 'Deep sci-fi ambience.',
	'floating-dreaming': 'Soft, airy soundscape.',
	'focus-meditation': 'Minimal, steady textures.'
};

interface CustomThemeEditorProps {
	onClose: () => void;
	onSave: (config: { baseThemeId: string | null; layers: string[], vantaEffect: Theme['vantaEffect'], volumes: Record<string, number> }) => void;
	currentConfig: { baseThemeId: string | null; layers: string[]; vantaEffect: Theme['vantaEffect'] };
	currentVolumes: Record<string, number>;
	allBaseThemes: Theme[];
	allLayers: SoundLayer[];
}

const CustomThemeEditor: React.FC<CustomThemeEditorProps> = ({
	onClose,
	onSave,
	currentConfig,
	currentVolumes,
	allBaseThemes,
	allLayers
}) => {
	const [selectedBaseTheme, setSelectedBaseTheme] = useState<string | null>(currentConfig.baseThemeId);
	const [selectedLayers, setSelectedLayers] = useState<string[]>(currentConfig.layers);
	const [selectedVantaEffect, setSelectedVantaEffect] = useState<Theme['vantaEffect']>(currentConfig.vantaEffect);
	const [selectedVolumes, setSelectedVolumes] = useState<Record<string, number>>(currentVolumes);

	useEffect(() => {
		setSelectedBaseTheme(currentConfig.baseThemeId);
		setSelectedLayers(currentConfig.layers);
		setSelectedVantaEffect(currentConfig.vantaEffect);
		setSelectedVolumes(currentVolumes);
	}, [currentConfig, currentVolumes]);

	const handleLayerToggle = (layerId: string) => {
		const isSelected = selectedLayers.includes(layerId);
		if (isSelected) {
			setSelectedLayers(prev => prev.filter(id => id !== layerId));
		} else if (selectedLayers.length < 7) {
			setSelectedLayers(prev => [...prev, layerId]);
			// Set a default volume for the newly added layer if it doesn't have one
			setSelectedVolumes(prev => ({ ...prev, [layerId]: prev[layerId] ?? 0.5 }));
		}
	};
    
    const handleSave = () => {
        if(selectedBaseTheme) {
			const finalVolumes: Record<string, number> = {};
			selectedLayers.forEach(layerId => {
				finalVolumes[layerId] = selectedVolumes[layerId] ?? 0.5; // Use existing or default volume
			});
            onSave({ 
				baseThemeId: selectedBaseTheme, 
				layers: selectedLayers, 
				vantaEffect: selectedVantaEffect,
				volumes: finalVolumes 
			});
            onClose();
        } else {
            alert("Please select a base music theme.");
        }
    };

	const handleSurpriseMe = () => {
		// 1. Pick a random base theme
		const randomTheme = allBaseThemes[Math.floor(Math.random() * allBaseThemes.length)];
		setSelectedBaseTheme(randomTheme.id);
	
		// 2. Define thematic sound palettes
		const palettes: Record<string, string[]> = {
			'dark-drone': ['planets', 'space_debris', 'nasa_chatter', 'thunder', 'whales'],
			'floating-dreaming': ['rain', 'forest', 'wind_chimes', 'crickets', 'birds', 'ocean', 'bubbles'],
			'focus-meditation': ['whales', 'bubbles', 'wind_chimes', 'ocean', 'rain']
		};
	
		// 3. Select 2-5 fitting layers from the palette
		const palette = palettes[randomTheme.id] || allLayers.map(l => l.id);
		const shuffledPalette = [...palette].sort(() => 0.5 - Math.random());
		const layerCount = Math.floor(Math.random() * 4) + 2; // Generate between 2 and 5 layers
		const newLayers = shuffledPalette.slice(0, layerCount);
		setSelectedLayers(newLayers);

		// 4. Assign random volumes to the new layers
		const newVolumes: Record<string, number> = {};
		newLayers.forEach(layerId => {
			newVolumes[layerId] = parseFloat((Math.random() * 0.5 + 0.3).toFixed(2)); // Random vol between 0.3 and 0.8
		});
		setSelectedVolumes(newVolumes);
	
		// 5. Pick a random background
		const randomBg = BACKGROUND_OPTIONS[Math.floor(Math.random() * BACKGROUND_OPTIONS.length)];
		setSelectedVantaEffect(randomBg.id);
	};

	const canAddMoreLayers = selectedLayers.length < 7;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md transition-opacity duration-300 animate-fade-in"
			onClick={onClose}
			aria-modal="true"
			role="dialog"
		>
			<style>{`
				@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
				.animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
				@keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
				.animate-scale-in { animation: scale-in 0.3s ease-out forwards; }
			`}</style>
			<div
				className="relative w-full max-w-2xl p-8 mx-4 bg-gray-900/70 border border-white/20 rounded-2xl shadow-2xl text-white animate-scale-in"
				onClick={(e) => e.stopPropagation()}
			>
				<button
					onClick={onClose}
					className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10"
					aria-label="Close"
				>
					<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
				<div className="flex justify-center items-center gap-3 mb-6">
					<h2 className="text-3xl font-bold text-center">Customize Your Theme</h2>
				</div>


				{/* Step 1: Choose Music */}
				<div className="mb-6">
					<h3 className="text-xl font-semibold text-white/90 mb-3">1. Choose Music</h3>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
						{allBaseThemes.map(theme => (
							<button
								key={theme.id}
								onClick={() => setSelectedBaseTheme(theme.id)}
								className={`text-left p-4 rounded-lg border-2 transition-all duration-200 ${selectedBaseTheme === theme.id ? 'bg-white/15 border-white/50' : 'bg-white/5 border-transparent hover:border-white/30'}`}
							>
								<p className="font-bold">{theme.name.split(' / ')[0]}</p>
								<p className="text-xs text-white/60">{THEME_SUBTITLES[theme.id]}</p>
							</button>
						))}
					</div>
				</div>

				{/* Step 2: Add Layers */}
				<div className="mb-6">
					<h3 className="text-xl font-semibold text-white/90 mb-3">2. Add Sound Layers ({selectedLayers.length}/7)</h3>
					<div className="p-4 bg-black/20 rounded-xl max-h-40 overflow-y-auto">
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
							{allLayers.map(layer => {
								const isSelected = selectedLayers.includes(layer.id);
								const isDisabled = !isSelected && !canAddMoreLayers;
								return (
									<button
										key={layer.id}
										onClick={() => handleLayerToggle(layer.id)}
										disabled={isDisabled}
										className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-all duration-200
											${isSelected ? 'bg-white/15 border-white/50' : 'bg-white/5 border-transparent hover:border-white/30'}
											${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
										`}
									>
										<i className={`${layer.icon} w-5 text-center`} />
										<span className="text-sm">{layer.name}</span>
									</button>
								);
							})}
						</div>
					</div>
				</div>

				{/* Step 3: Choose Background */}
				<div className="mb-8">
                    <h3 className="text-xl font-semibold text-white/90 mb-3">3. Choose Background</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {BACKGROUND_OPTIONS.map(option => (
                            <button
                                key={option.id}
                                onClick={() => setSelectedVantaEffect(option.id)}
                                className={`text-left p-4 rounded-lg border-2 transition-all duration-200 ${selectedVantaEffect === option.id ? 'bg-white/15 border-white/50' : 'bg-white/5 border-transparent hover:border-white/30'}`}
                            >
                                <p className="font-bold">{option.name}</p>
                                <p className="text-xs text-white/60">{option.description}</p>
                            </button>
                        ))}
                    </div>
                </div>
				
				<div className="flex justify-center gap-4">
					<button
						onClick={handleSurpriseMe}
						className="shine-hover px-6 py-3 font-bold bg-white/5 backdrop-blur-md text-white rounded-xl hover:bg-white/15 transition-colors ring-1 ring-inset ring-white/20 flex items-center gap-2"
					>
						<i className="fa-solid fa-dice"></i>
						Surprise Me
					</button>
					<button
						onClick={handleSave}
						disabled={!selectedBaseTheme}
						className="shine-hover px-8 py-3 text-lg font-bold bg-white/15 backdrop-blur-md text-white rounded-xl hover:bg-white/25 transition-colors ring-1 ring-inset ring-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Save and Apply
					</button>
				</div>
			</div>
		</div>
	);
};

export default CustomThemeEditor;