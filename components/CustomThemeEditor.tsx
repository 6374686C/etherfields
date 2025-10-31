import React, { useState, useEffect } from 'react';
import { Theme, SoundLayer } from '../types';

interface CustomThemeEditorProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (config: { baseThemeId: string | null; layers: string[] }) => void;
	currentConfig: { baseThemeId: string | null; layers: string[] };
	allBaseThemes: Theme[];
	allLayers: SoundLayer[];
}

const CustomThemeEditor: React.FC<CustomThemeEditorProps> = ({
	isOpen,
	onClose,
	onSave,
	currentConfig,
	allBaseThemes,
	allLayers
}) => {
	const [selectedBaseTheme, setSelectedBaseTheme] = useState<string | null>(currentConfig.baseThemeId);
	const [selectedLayers, setSelectedLayers] = useState<string[]>(currentConfig.layers);

	useEffect(() => {
		setSelectedBaseTheme(currentConfig.baseThemeId);
		setSelectedLayers(currentConfig.layers);
	}, [currentConfig]);

	if (!isOpen) return null;

	const handleLayerToggle = (layerId: string) => {
		setSelectedLayers(prev => {
			if (prev.includes(layerId)) {
				return prev.filter(id => id !== layerId);
			}
			if (prev.length < 5) {
				return [...prev, layerId];
			}
			return prev; // Limit reached
		});
	};
    
    const handleSave = () => {
        if(selectedBaseTheme) {
            onSave({ baseThemeId: selectedBaseTheme, layers: selectedLayers });
            onClose();
        } else {
            // maybe show an alert
            alert("Please select a base music theme.");
        }
    };

	const canAddMoreLayers = selectedLayers.length < 5;

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
					className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
					aria-label="Close"
				>
					<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
				<h2 className="text-3xl font-bold mb-6 text-center">Customize Your Theme</h2>

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
				<div className="mb-8">
					<h3 className="text-xl font-semibold text-white/90 mb-3">2. Add Sound Layers ({selectedLayers.length}/5)</h3>
					<div className="p-4 bg-black/20 rounded-xl max-h-60 overflow-y-auto">
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
				
				<div className="flex justify-center">
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

const THEME_SUBTITLES: Record<string, string> = {
	'dark-drone': 'Deep sci-fi ambience.',
	'floating-dreaming': 'Soft, airy soundscape.',
	'focus-meditation': 'Minimal, steady textures.'
};

export default CustomThemeEditor;