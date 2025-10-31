import React, { useRef, useEffect } from 'react';
import { RemoveIcon } from './Icons';

interface VolumeSliderProps {
	label: string;
	iconClassName: string;
	value: number;
	onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
	isEditing?: boolean;
	onRemove?: () => void;
}

const clamp = (v: number) => Math.max(0, Math.min(1, v));

const VolumeSlider: React.FC<VolumeSliderProps> = ({
	label,
	iconClassName,
	value,
	onChange,
	isEditing = false,
	onRemove
}) => {
	const trackRef = useRef<HTMLDivElement>(null);
	const thumbRef = useRef<HTMLDivElement>(null);

	// set initial visual position
	useEffect(() => {
		const v = clamp(value);
		if (trackRef.current) trackRef.current.style.setProperty('--fill', `${v * 100}%`);
		if (thumbRef.current) thumbRef.current.style.top = `calc(${100 - v * 100}% - 10px)`;
	}, [value]);

	const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		const v = clamp(parseFloat(e.target.value));

		// instant visual update (no React re-render needed for the look)
		if (trackRef.current) trackRef.current.style.setProperty('--fill', `${v * 100}%`);
		if (thumbRef.current) thumbRef.current.style.top = `calc(${100 - v * 100}% - 10px)`;

		// still tell parent (audio + save)
		onChange(e);
	};

	return (
		<div className="relative flex flex-col items-center justify-end h-full w-20 space-y-3">
			{isEditing && (
				<button
					onClick={onRemove}
					className="shine-hover absolute -top-5 z-20 w-7 h-7 flex items-center justify-center bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition-all duration-150 ring-1 ring-inset ring-white/30 hover:ring-white/60"
					aria-label={`Remove ${label} layer`}
				>
					<RemoveIcon className="w-4 h-4" />
				</button>
			)}

			<div className="w-8 h-8 flex items-center justify-center">
				<i className={`${iconClassName} text-2xl text-white/70`} />
			</div>

			{/* slider body */}
			<div className="relative flex-grow w-full flex items-center justify-center">
				{/* our tube */}
				<div
					ref={trackRef}
					className="relative w-2 h-full rounded-full overflow-hidden border border-white/30 bg-transparent"
					style={{ ['--fill' as any]: `${clamp(value) * 100}%` }}
				>
					{/* bottom = pure white, top = dark transparent (like your ref) */}
					<div
						className="absolute inset-0"
						style={{
							background:
								'linear-gradient(to top, rgba(255,255,255,1) var(--fill), rgba(7,10,25,0.15) var(--fill))'
						}}
					/>
				</div>

				{/* our own white circle */}
				<div
					ref={thumbRef}
					className="absolute left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white shadow-[0_0_14px_rgba(255,255,255,0.45)] pointer-events-none transition-transform duration-75"
					style={{ top: 'calc(100% - 10px)' }}
				/>

				{/* the real input (full area, invisible) */}
				<input
					id={label}
					type="range"
					min="0"
					max="1"
					step="0.01"
					value={value}
					onInput={handleInput}
					onChange={handleInput}
					className="absolute inset-0 w-full h-full opacity-0 cursor-pointer [appearance:none] bg-transparent"
					style={{ WebkitAppearance: 'slider-vertical' } as React.CSSProperties}
				/>
			</div>

			<label htmlFor={label} className="text-sm text-white/80 whitespace-nowrap text-center">
				{label}
			</label>

			<style>{`
				/* kill native grey tracks */
				input[type=range][style*="slider-vertical"]::-webkit-slider-runnable-track {
					background: transparent !important;
					border: none !important;
				}
				input[type=range][style*="slider-vertical"]::-moz-range-track {
					background: transparent !important;
					border: none !important;
				}

				/* we don't want the browser thumb, we draw our own */
				input[type=range][style*="slider-vertical"]::-webkit-slider-thumb {
					-webkit-appearance: none;
					appearance: none;
					width: 0;
					height: 0;
				}
				input[type=range][style*="slider-vertical"]::-moz-range-thumb {
					width: 0;
					height: 0;
					border: none;
				}
			`}</style>
		</div>
	);
};

export default VolumeSlider;
