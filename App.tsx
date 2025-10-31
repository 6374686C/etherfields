import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAudioEngine } from './hooks/useAudioEngine';
import { Theme, SoundLayer } from './types';
import { THEMES, ALL_SOUND_LAYERS, FADE_TIME } from './constants';
import ThemeSelector from './components/ThemeSelector';
import VolumeSlider from './components/VolumeSlider';
import MasterControls from './components/MasterControls';
import VantaBackground from './components/VantaBackground';
import LayerEditor from './components/LayerEditor';
import InfoModal from './components/InfoModal';
import { SparklesIcon, EditIcon, EyeIcon, EyeSlashIcon, InfoIcon } from './components/Icons';

// ---- Subtitles here (edit freely) ----
const THEME_SUBTITLES: Record<string, string> = {
	'dark-drone': 'Dark sci-fi bed: deep engines, space hum, and distant storms.',
	'floating-dreaming': 'Soft, airy ambience for relaxing, reading, or winding down.',
	'focus-meditation': 'Minimal, steady textures that help you settle into deep work.'
};
// --------------------------------------

const getInitialState = <T,>(key: string, defaultValue: T): T => {
	try {
		const storedValue = localStorage.getItem(key);
		return storedValue ? (JSON.parse(storedValue) as T) : defaultValue;
	} catch (error) {
		console.error(`Error parsing localStorage key "${key}":`, error);
		return defaultValue;
	}
};

const App: React.FC = () => {
	const [isEditing, setIsEditing] = useState(false);
	const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
	const [isUIVisible, setIsUIVisible] = useState(true);
	const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

	const [customThemes, setCustomThemes] = useState<Record<string, Theme>>(() => {
		const defaultThemes = THEMES.reduce((acc, theme) => ({ ...acc, [theme.id]: theme }), {});
		return getInitialState('etherfields_custom_themes', defaultThemes);
	});

	const [activeThemeId, setActiveThemeId] = useState<string>(() =>
		getInitialState('etherfields_active_theme_id', THEMES[0].id)
	);

	const [mainThemeVolumes, setMainThemeVolumes] = useState<Record<string, number>>(() => {
		const defaultVolumes = THEMES.reduce(
			(acc, theme) => ({ ...acc, [theme.id]: theme.defaultThemeVolume }),
			{}
		);
		return getInitialState('etherfields_main_theme_volumes', defaultVolumes);
	});

	const [themeVolumes, setThemeVolumes] = useState<Record<string, Record<string, number>>>(() => {
		const defaultVolumes = THEMES.reduce(
			(acc, theme) => ({ ...acc, [theme.id]: theme.defaultVolumes }),
			{}
		);
		return getInitialState('etherfields_theme_volumes', defaultVolumes);
	});

	const activeTheme = useMemo(() => customThemes[activeThemeId], [customThemes, activeThemeId]);
	const activeVolumes = useMemo(() => themeVolumes[activeThemeId] || {}, [themeVolumes, activeThemeId]);

	const allInitialVolumes = useMemo(() => {
		const initialVols: Record<string, number> = {};
		ALL_SOUND_LAYERS.forEach((layer) => {
			initialVols[layer.id] = activeTheme.layers.includes(layer.id)
				? activeVolumes[layer.id] ?? 0
				: 0;
		});
		return initialVols;
	}, [activeTheme, activeVolumes]);

	const {
		isInitialized,
		isLoading,
		isMuted,
		initializeAudio,
		selectTheme,
		setLayerVolume,
		setMainVolume,
		toggleMute
	} = useAudioEngine({
		themes: THEMES,
		allLayers: ALL_SOUND_LAYERS,
		initialThemeId: activeThemeId,
		initialVolumes: allInitialVolumes,
		initialMainVolume: mainThemeVolumes[activeThemeId]
	});

	useEffect(() => {
		if (isInitialized)
			localStorage.setItem('etherfields_active_theme_id', JSON.stringify(activeThemeId));
	}, [activeThemeId, isInitialized]);

	useEffect(() => {
		if (isInitialized)
			localStorage.setItem('etherfields_main_theme_volumes', JSON.stringify(mainThemeVolumes));
	}, [mainThemeVolumes, isInitialized]);

	useEffect(() => {
		if (isInitialized)
			localStorage.setItem('etherfields_custom_themes', JSON.stringify(customThemes));
	}, [customThemes, isInitialized]);

	useEffect(() => {
		if (isInitialized)
			localStorage.setItem('etherfields_theme_volumes', JSON.stringify(themeVolumes));
	}, [themeVolumes, isInitialized]);

	useEffect(() => {
		const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
		document.addEventListener('fullscreenchange', handleFullscreenChange);
		return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
	}, []);

	const handleToggleFullscreen = useCallback(() => {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen().catch((err) => {
				console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
			});
		} else {
			if (document.exitFullscreen) document.exitFullscreen();
		}
	}, []);

	const handleThemeChange = useCallback(
		(theme: Theme) => {
			const oldTheme = activeTheme;
			oldTheme.layers.forEach((layerId) => {
				if (!theme.layers.includes(layerId)) setLayerVolume(layerId, 0, FADE_TIME);
			});

			setActiveThemeId(theme.id);
			const newThemeMainVolume = mainThemeVolumes[theme.id] ?? theme.defaultThemeVolume;
			selectTheme(theme.id, newThemeMainVolume);

			const newThemeVolumes = themeVolumes[theme.id] || customThemes[theme.id].defaultVolumes;
			customThemes[theme.id].layers.forEach((layerId) => {
				setLayerVolume(layerId, newThemeVolumes[layerId] ?? 0, FADE_TIME);
			});
			setIsEditing(false);
		},
		[selectTheme, setLayerVolume, activeTheme, themeVolumes, customThemes, mainThemeVolumes]
	);

	const handleMainVolumeChange = useCallback(
		(volume: number) => {
			setMainThemeVolumes((prev) => ({
				...prev,
				[activeThemeId]: volume
			}));
			setMainVolume(volume);
		},
		[setMainVolume, activeThemeId]
	);

	const handleVolumeChange = useCallback(
		(id: string, volume: number) => {
			setThemeVolumes((prev) => ({
				...prev,
				[activeThemeId]: {
					...(prev[activeThemeId] || {}),
					[id]: volume
				}
			}));
			setLayerVolume(id, volume);
		},
		[setLayerVolume, activeThemeId]
	);

	const handleLayerRemove = useCallback(
		(layerIdToRemove: string) => {
			setCustomThemes((prev) => ({
				...prev,
				[activeThemeId]: {
					...prev[activeThemeId],
					layers: prev[activeThemeId].layers.filter((id) => id !== layerIdToRemove)
				}
			}));
			handleVolumeChange(layerIdToRemove, 0);
		},
		[activeThemeId, handleVolumeChange]
	);

	const handleLayerAdd = useCallback(
		(layerIdToAdd: string) => {
			setCustomThemes((prev) => ({
				...prev,
				[activeThemeId]: {
					...prev[activeThemeId],
					layers: [...prev[activeThemeId].layers, layerIdToAdd]
				}
			}));
			handleVolumeChange(layerIdToAdd, 0.5);
		},
		[activeThemeId, handleVolumeChange]
	);

	const handleResetToDefault = useCallback(() => {
		const defaultTheme = THEMES.find((t) => t.id === activeThemeId);
		if (!defaultTheme) return;

		const oldCustomTheme = customThemes[activeThemeId];

		setCustomThemes((prev) => ({ ...prev, [activeThemeId]: defaultTheme }));
		setThemeVolumes((prev) => ({ ...prev, [activeThemeId]: defaultTheme.defaultVolumes }));
		setMainThemeVolumes((prev) => ({ ...prev, [activeThemeId]: defaultTheme.defaultThemeVolume }));
		setMainVolume(defaultTheme.defaultThemeVolume);

		const allLayerIds = new Set([...oldCustomTheme.layers, ...defaultTheme.layers]);
		allLayerIds.forEach((layerId) => {
			const newVolume = defaultTheme.layers.includes(layerId)
				? defaultTheme.defaultVolumes[layerId] ?? 0
				: 0;
			setLayerVolume(layerId, newVolume);
		});
	}, [activeThemeId, customThemes, setLayerVolume, setMainVolume]);

	const currentLayerSet = useMemo(() => {
		return activeTheme.layers
			.map((id) => ALL_SOUND_LAYERS.find((l) => l.id === id))
			.filter((l): l is SoundLayer => !!l);
	}, [activeTheme]);

	const themeFontClasses: Record<string, string> = {
		'dark-drone': 'font-orbitron',
		'floating-dreaming': 'font-dancing-script',
		'focus-meditation': 'font-josefin-sans'
	};
	const fontClass = themeFontClasses[activeTheme.id] || '';

	return (
		<main className="w-screen h-screen overflow-hidden flex items-center justify-center p-4 text-white">
			<VantaBackground activeTheme={activeTheme} volumes={activeVolumes} />

			{!isInitialized ? (
				<div className="relative z-10 flex flex-col items-center text-center">
					<h1 className="text-5xl md:text-7xl font-bold tracking-wider mb-4">Etherfields</h1>
					<p className="text-lg md:text-xl text-white/80 mb-8 max-w-lg">
						Create your own immersive soundscape. Click below to begin.
					</p>
					<button
						onClick={initializeAudio}
						disabled={isLoading}
						className="shine-hover group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-white/5 backdrop-blur-md rounded-full shadow-lg ring-1 ring-inset ring-white/20 transition-all duration-300 hover:bg-white/15 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white/60 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isLoading ? (
							'Loading Assets...'
						) : (
							<>
								<SparklesIcon className="w-6 h-6 mr-3" />
								Start Experience
							</>
						)}
					</button>
				</div>
			) : (
				<>
					<div
						className={`relative z-10 w-full max-w-4xl mx-auto transition-all duration-700 ease-in-out ${
							isUIVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'
						}`}
					>
						<div className="relative w-full p-6 md:p-10 bg-black/30 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20">
							<style>{`
								.font-orbitron { font-family: 'Orbitron', sans-serif; }
								.font-dancing-script { font-family: 'Dancing Script', cursive; }
								.font-josefin-sans { font-family: 'Josefin Sans', sans-serif; }
								.glow { text-shadow: 0 0 8px rgba(255, 255, 255, 0.4), 0 0 2px rgba(255, 255, 255, 0.6); }
							`}</style>

							<div className="absolute top-6 right-6 z-20 flex items-center gap-x-2">
								<button
									onClick={() => setIsInfoModalOpen(true)}
									className="shine-hover p-2 bg-white/5 backdrop-blur-md rounded-full hover:bg-white/15 transition-all duration-300 ring-1 ring-inset ring-white/20 hover:ring-white/30"
									aria-label="About this app"
									title="About this app"
								>
									<InfoIcon className="w-6 h-6" />
								</button>
								<button
									onClick={() => setIsEditing(!isEditing)}
									className="shine-hover p-2 bg-white/5 backdrop-blur-md rounded-full hover:bg-white/15 transition-all duration-300 ring-1 ring-inset ring-white/20 hover:ring-white/30"
									aria-label="Edit Layers"
									title="Edit Layers"
								>
									<EditIcon className="w-6 h-6" />
								</button>
							</div>

							<header className="text-center mb-6">
								<h1 className={`text-4xl md:text-5xl font-bold tracking-wider transition-all duration-500 ease-in-out ${fontClass} glow`}>
									{activeTheme.name.split('/')[0]}
								</h1>
								<p className="text-gray-300 mt-2 text-lg">
									{THEME_SUBTITLES[activeTheme.id] ?? activeTheme.name}
								</p>
							</header>

							<ThemeSelector themes={THEMES} activeTheme={activeTheme} onSelect={handleThemeChange} />

							<div className="flex flex-row justify-center items-end gap-x-2 md:gap-x-6 my-8 px-2 h-60 min-h-60">
								<VolumeSlider
									key="main-theme"
									label="Atmosphere"
									iconClassName="fa-solid fa-wave-square"
									value={mainThemeVolumes[activeThemeId] ?? 0.7}
									onChange={(e) => handleMainVolumeChange(parseFloat(e.target.value))}
								/>
								{currentLayerSet.map((layer) => (
									<VolumeSlider
										key={layer.id}
										label={layer.name}
										iconClassName={layer.icon}
										value={activeVolumes[layer.id] ?? 0}
										onChange={(e) => handleVolumeChange(layer.id, parseFloat(e.target.value))}
										isEditing={isEditing}
										onRemove={() => handleLayerRemove(layer.id)}
									/>
								))}
							</div>

							{isEditing && (
								<LayerEditor
									activeThemeLayers={activeTheme.layers}
									onAddLayer={handleLayerAdd}
									onReset={handleResetToDefault}
								/>
							)}

							<MasterControls isMuted={isMuted} onToggleMute={toggleMute} />
						</div>
					</div>

					<InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />

					{/* Bottom-right controls: icon-only */}
					<div className="fixed z-20 bottom-6 right-6 flex gap-4">
						<button
							onClick={handleToggleFullscreen}
							className="text-white/60 hover:text-white transition-colors duration-150"
							aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
							title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
						>
							<i className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'} text-2xl`}></i>
						</button>

						<button
							onClick={() => setIsUIVisible(!isUIVisible)}
							className="text-white/60 hover:text-white transition-colors duration-150"
							aria-label={isUIVisible ? 'Hide UI' : 'Show UI'}
							title={isUIVisible ? 'Hide UI' : 'Show UI'}
						>
							{isUIVisible ? <EyeIcon className="text-2xl" /> : <EyeSlashIcon className="text-2xl" />}
						</button>
					</div>
				</>
			)}
		</main>
	);
};

export default App;