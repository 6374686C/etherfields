import React from 'react';
import { Theme } from '../types';

interface ThemeSelectorProps {
	themes: Theme[];
	activeTheme: Theme;
	onSelect: (theme: Theme) => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ themes, activeTheme, onSelect }) => {
	return (
		<div className="flex justify-center space-x-2 md:space-x-4">
			{themes.map((theme) => {
				const isActive = activeTheme.id === theme.id;
				return (
					<button
						key={theme.id}
						onClick={() => onSelect(theme)}
						className={`shine-hover relative px-6 py-3 rounded-2xl font-semibold transition-all duration-200 outline-none
							${isActive
								? 'bg-white/15 backdrop-blur-md text-white ring-1 ring-white/50 shadow-lg'
								: 'bg-white/5 backdrop-blur-md text-white hover:bg-white/10 ring-1 ring-white/15 hover:ring-white/25'}
						`}
					>
						<span className="relative z-10">
							{theme.name.split(' / ')[0]}
						</span>
					</button>
				);
			})}
		</div>
	);
};

export default ThemeSelector;
