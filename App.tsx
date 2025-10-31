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
import CustomThemeEditor from './components/CustomThemeEditor';
import { SparklesIcon, EditIcon, EyeIcon, EyeSlashIcon, InfoIcon, PlusIcon } from './components/Icons';

// ---- Subtitles here (edit freely) ----
const THEME_SUBTITLES: Record<string, string> = {
	'dark-drone': 'Immersive dark ambience: resonant engines, cosmic hums, and drifting worlds',
	'floating-dreaming': 'Ethereal soundscape: gentle waves of air and light to drift, dream, and unwind',
	'focus-meditation': 'Calm tonal flow: minimal textures and slow pulses to deepen focus and stillness'
};
// --------------------------------------

const CUSTOM_THEME_ID = 'custom';

// Define a special theme for the pre-initialized welcome screen
const preInitTheme: Theme = {
	id: 'welcome-screen',
	name: 'Welcome',
	audioSrc: '',
	vantaEffect: 'WAVES',
	layers: [],
	defaultThemeVolume: 0,
	defaultVolumes: {}
};

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
	const [isCustomEditorOpen, setIsCustomEditorOpen] = useState(false);
	const [isUIVisible, setIsUIVisible] = useState(true);
	const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

	const [customThemes, setCustomThemes] = useState<Record<string, Theme>>(() => {
		const defaultThemes = THEMES.reduce((acc, theme) => ({ ...acc, [theme.id]: theme }), {});
		return getInitialState('etherfields_custom_themes', defaultThemes);
	});

	const [activeThemeId, setActiveThemeId] = useState<string>(() =>
		getInitialState('etherfields_active_theme_id', 'dark-drone') // Default to Dark Drone theme
	);
	
	const [customThemeConfig, setCustomThemeConfig] = useState<{ baseThemeId: string | null; layers: string[]; vantaEffect: Theme['vantaEffect'] }>(() =>
		getInitialState('etherfields_custom_config', { baseThemeId: null, layers: [], vantaEffect: 'FOG' })
	);

	const [mainThemeVolumes, setMainThemeVolumes] = useState<Record<string, number>>(() => {
		const defaultVolumes = THEMES.reduce(
			(acc, theme) => ({ ...acc, [theme.id]: theme.defaultThemeVolume }),
			{}
		);
		const initialCustomVolume = { [CUSTOM_THEME_ID]: 0.7 };
		return getInitialState('etherfields_main_theme_volumes', {...defaultVolumes, ...initialCustomVolume});
	});

	const [themeVolumes, setThemeVolumes] = useState<Record<string, Record<string, number>>>(() => {
		const defaultVolumes = THEMES.reduce(
			(acc, theme) => ({ ...acc, [theme.id]: theme.defaultVolumes }),
			{}
		);
		return getInitialState('etherfields_theme_volumes', defaultVolumes);
	});

	// FIX: Explicitly set the return type of useMemo to `Theme` to fix type inference issues.
	// This ensures `activeTheme` has a consistent and correct type, resolving downstream errors.
	const activeTheme = useMemo((): Theme => {
        if (activeThemeId === CUSTOM_THEME_ID) {
            const baseTheme = THEMES.find(t => t.id === customThemeConfig.baseThemeId) || THEMES[0];
            return {
                id: CUSTOM_THEME_ID,
                name: 'Custom',
                audioSrc: baseTheme.audioSrc,
                vantaEffect: customThemeConfig.vantaEffect,
                layers: customThemeConfig.layers,
                defaultThemeVolume: 0.7,
                defaultVolumes: {},
            };
        }
		return customThemes[activeThemeId] || THEMES[0];
	}, [customThemes, activeThemeId, customThemeConfig]);
    
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
		toggleMute,
		resetAndPlayTheme
	} = useAudioEngine({
		themes: THEMES,
		allLayers: ALL_SOUND_LAYERS,
		initialThemeId: activeThemeId === CUSTOM_THEME_ID ? (customThemeConfig.baseThemeId || THEMES[0].id) : activeThemeId,
		initialVolumes: allInitialVolumes,
		initialMainVolume: mainThemeVolumes[activeThemeId]
	});

	useEffect(() => {
		if (isInitialized) localStorage.setItem('etherfields_active_theme_id', JSON.stringify(activeThemeId));
	}, [activeThemeId, isInitialized]);
	
	useEffect(() => {
		if (isInitialized) localStorage.setItem('etherfields_custom_config', JSON.stringify(customThemeConfig));
	}, [customThemeConfig, isInitialized]);

	useEffect(() => {
		if (isInitialized) localStorage.setItem('etherfields_main_theme_volumes', JSON.stringify(mainThemeVolumes));
	}, [mainThemeVolumes, isInitialized]);

	useEffect(() => {
		if (isInitialized) localStorage.setItem('etherfields_custom_themes', JSON.stringify(customThemes));
	}, [customThemes, isInitialized]);

	useEffect(() => {
		if (isInitialized) localStorage.setItem('etherfields_theme_volumes', JSON.stringify(themeVolumes));
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
			if (theme.id === activeThemeId) return;

			// If selecting custom theme and it's not set up, open editor first.
			if (theme.id === CUSTOM_THEME_ID && !customThemeConfig.baseThemeId) {
				setIsCustomEditorOpen(true);
				return;
			}
			
			const oldTheme = activeTheme;
			oldTheme.layers.forEach((layerId) => {
				if (!theme.layers.includes(layerId)) {
					setLayerVolume(layerId, 0, FADE_TIME);
				}
			});

			setActiveThemeId(theme.id);
			
			const isSwitchingToCustom = theme.id === CUSTOM_THEME_ID;
			const audioThemeToPlay = isSwitchingToCustom ? customThemeConfig.baseThemeId! : theme.id;
			const newThemeMainVolume = mainThemeVolumes[theme.id] ?? theme.defaultThemeVolume;
			selectTheme(audioThemeToPlay, newThemeMainVolume);

			const newThemeVolumes = themeVolumes[theme.id] || customThemes[theme.id]?.defaultVolumes || {};
			theme.layers.forEach((layerId) => {
				setLayerVolume(layerId, newThemeVolumes[layerId] ?? 0.5, FADE_TIME);
			});
			setIsEditing(false);
		},
		[activeThemeId, selectTheme, setLayerVolume, activeTheme, themeVolumes, customThemes, mainThemeVolumes, customThemeConfig]
	);

	const handleMainVolumeChange = useCallback(
		(volume: number) => {
			setMainThemeVolumes((prev) => ({ ...prev, [activeThemeId]: volume }));
			const audioThemeId = activeThemeId === CUSTOM_THEME_ID ? customThemeConfig.baseThemeId : activeThemeId;
			if (audioThemeId) {
				setMainVolume(volume, 0.1, audioThemeId);
			}
		},
		[setMainVolume, activeThemeId, customThemeConfig.baseThemeId]
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
		setMainVolume(defaultTheme.defaultThemeVolume, FADE_TIME, defaultTheme.id);

		const allLayerIds = new Set([...oldCustomTheme.layers, ...defaultTheme.layers]);
		allLayerIds.forEach((layerId) => {
			const newVolume = defaultTheme.layers.includes(layerId)
				? defaultTheme.defaultVolumes[layerId] ?? 0
				: 0;
			setLayerVolume(layerId, newVolume, FADE_TIME);
		});
	}, [activeThemeId, customThemes, setLayerVolume, setMainVolume]);

	const handleSaveCustomTheme = useCallback((config: { 
		baseThemeId: string | null; 
		layers: string[]; 
		vantaEffect: Theme['vantaEffect'],
		volumes: Record<string, number>;
	}) => {
		if (!config.baseThemeId) return;

		// 1. Persist the new volumes for the custom theme UI
		setThemeVolumes(prev => ({
			...prev,
			[CUSTOM_THEME_ID]: config.volumes,
		}));
	
		// 2. Call the atomic "stop-then-start" audio function with new volumes
		resetAndPlayTheme(
			config.baseThemeId,
			config.layers,
			mainThemeVolumes[CUSTOM_THEME_ID] ?? 0.7,
			config.volumes
		);
	
		// 3. Update React state to match the new audio state
		setCustomThemeConfig({
			baseThemeId: config.baseThemeId,
			layers: config.layers,
			vantaEffect: config.vantaEffect,
		});
		setActiveThemeId(CUSTOM_THEME_ID);
	
	}, [resetAndPlayTheme, mainThemeVolumes]);

	const currentLayerSet = useMemo(() => {
		return activeTheme.layers
			.map((id) => ALL_SOUND_LAYERS.find((l) => l.id === id))
			.filter((l): l is SoundLayer => !!l);
	}, [activeTheme]);

	const themesForSelector = useMemo((): Theme[] => {
		const customThemeForUI: Theme = {
			id: CUSTOM_THEME_ID, name: 'Custom', audioSrc: '', vantaEffect: 'HALO',
			layers: [], defaultThemeVolume: 0.7, defaultVolumes: {}
		};
		return [...THEMES, customThemeForUI];
	}, []);
	
	const handleEditClick = () => {
		if (activeThemeId === CUSTOM_THEME_ID) {
			setIsCustomEditorOpen(true);
		} else {
			setIsEditing(!isEditing);
		}
	};

	const themeFontClasses: Record<string, string> = {
		'dark-drone': 'font-orbitron',
		'floating-dreaming': 'font-dancing-script',
		'focus-meditation': 'font-josefin-sans',
		[CUSTOM_THEME_ID]: 'font-poppins'
	};
	const fontClass = themeFontClasses[activeTheme.id] || 'font-josefin-sans';
	
	const mainSliderInfo = useMemo(() => {
		if (activeThemeId === CUSTOM_THEME_ID) {
			const base = THEMES.find(t => t.id === customThemeConfig.baseThemeId);
            if (base) {
                // 'Floating / Dreaming' -> 'Floating'
                // 'Dark Drone' -> 'Dark'
                const shortName = base.name.split(' / ')[0].split(' ')[0];
                return { label: shortName, icon: 'fa-solid fa-music' };
            }
			return { label: 'Music', icon: 'fa-solid fa-music' };
		}
		return { label: 'Music', icon: 'fa-solid fa-music' };
	}, [activeThemeId, customThemeConfig.baseThemeId]);

	return (
		<main className="w-screen h-screen overflow-hidden flex items-center justify-center p-4 text-white">
			<VantaBackground 
				activeTheme={isInitialized ? activeTheme : preInitTheme} 
				volumes={isInitialized ? activeVolumes : {}} 
			/>

			{!isInitialized ? (
				<>
					<div className="relative z-10 flex flex-col items-center text-center">
						<h1 className="cinematic-shine text-5xl md:text-7xl font-bold tracking-tight mb-4 font-josefin-sans">Etherfields</h1>
						<p className="text-sm md:text-base text-white mb-8 max-w-lg">
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
					<div className="fixed z-20 bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-xs md:text-sm pointer-events-none text-shadow-subtle">
						<span>🎧 3D Binaural Sounds | Headphones recommended</span>
					</div>
				</>
			) : (
				<>
					<div
						className={`relative z-10 w-full max-w-4xl mx-auto transition-all duration-700 ease-in-out ${
							isUIVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'
						}`}
					>
						<div className="relative w-full p-6 md:p-10 bg-black/30 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20">
							
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
									onClick={handleEditClick}
									className="shine-hover p-2 bg-white/5 backdrop-blur-md rounded-full hover:bg-white/15 transition-all duration-300 ring-1 ring-inset ring-white/20 hover:ring-white/30"
									aria-label="Edit Layers"
									title="Edit Layers"
								>
									<EditIcon className="w-6 h-6" />
								</button>
							</div>

							<header className="text-center mb-8">
								<h1 className={`text-4xl md:text-5xl font-normal tracking-tighter transition-all duration-500 ease-in-out ${fontClass} glow`}>
									{activeTheme.name.split('/')[0]}
								</h1>
								<p className="text-white mt-4 text-sm">
									{THEME_SUBTITLES[activeTheme.id] ?? 'Shape your own ambient world: blend tones, textures, and nature into a realm uniquely yours'}
								</p>
							</header>

							<ThemeSelector themes={themesForSelector} activeTheme={activeTheme} onSelect={handleThemeChange} />
                            
                            <div className="slider-container relative w-full overflow-x-auto pb-4 -mb-4">
                                <div className="flex flex-row justify-start md:justify-center items-end gap-x-4 md:gap-x-6 my-8 px-4 md:px-2 h-60 min-h-60 min-w-max">
                                    {activeTheme.id === CUSTOM_THEME_ID && !customThemeConfig.baseThemeId ? (
                                        <div className="flex flex-col items-center justify-center h-full w-full">
                                            <button 
                                                onClick={() => setIsCustomEditorOpen(true)}
                                                className="shine-hover flex flex-col items-center justify-center p-8 bg-white/5 backdrop-blur-md rounded-2xl hover:bg-white/15 transition-all duration-300 ring-1 ring-inset ring-white/20 hover:ring-white/30"
                                            >
                                                <PlusIcon className="w-12 h-12" />
                                                <span className="mt-4 text-lg font-semibold">Add Sounds</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <VolumeSlider
                                                key="main-theme"
                                                label={mainSliderInfo.label}
                                                iconClassName={mainSliderInfo.icon}
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
                                                    isEditing={isEditing && activeThemeId !== CUSTOM_THEME_ID}
                                                    onRemove={() => handleLayerRemove(layer.id)}
                                                />
                                            ))}
                                        </>
                                    )}
                                </div>
                            </div>


							{isEditing && activeThemeId !== CUSTOM_THEME_ID && (
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
					{isCustomEditorOpen && <CustomThemeEditor
						onClose={() => setIsCustomEditorOpen(false)}
						onSave={handleSaveCustomTheme}
						currentConfig={customThemeConfig}
						currentVolumes={themeVolumes[CUSTOM_THEME_ID] || {}}
						allBaseThemes={THEMES}
						allLayers={ALL_SOUND_LAYERS}
					/>}

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