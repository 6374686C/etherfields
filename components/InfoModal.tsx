import React from 'react';

interface InfoModalProps {
	isOpen: boolean;
	onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
	if (!isOpen) return null;

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
				className="relative w-full max-w-lg p-8 mx-4 bg-gray-900/70 border border-white/20 rounded-2xl shadow-2xl text-white animate-scale-in backdrop-blur-2xl"
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

				<h2 className="text-3xl font-bold mb-4 text-center">About Etherfields</h2>

				&nbsp;
				<p className="text-gray-300 mb-6 text-center">
					Etherfields is a small ambient sound designer in your browser. 
					Pick a base atmosphere, layer in environmental sounds, and blend them together until it feels right.
				</p>

				<div className="space-y-4">
					<div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
						<span className="font-semibold text-gray-200">Follow on YouTube</span>
						<a
							href="https://www.youtube.com/@etherfields_app"
							target="_blank"
							rel="noopener noreferrer"
							className="shine-hover flex items-center gap-2 px-3 py-1.5 text-sm font-semibold bg-white/5 backdrop-blur-md text-white rounded-lg hover:bg-white/15 transition-colors ring-1 ring-inset ring-white/20 hover:ring-white/30"
						>
							<i className="fa-brands fa-youtube text-red-500 text-lg"></i>
							<span>Follow</span>
						</a>
					</div>
					{/* Ko-fi row */}
					<div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
						<span className="font-semibold text-gray-200">Support Me</span>
						<a
							href="https://ko-fi.com/K3K019YFF8"
							target="_blank"
							rel="noreferrer"
							className="flex-shrink-0"
						>
							<img
								src="https://storage.ko-fi.com/cdn/kofi4.png?v=6"
								alt="Support me on Ko-fi"
								height={36}
								style={{ height: 36, border: 0 }}
							/>
						</a>
					</div>
					<div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
						<span className="font-semibold text-gray-200">Contact</span>
						<a
							href="mailto:hello@unableton.com"
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-400 hover:text-blue-300 transition-colors"
						>
							hello[at]unableton.com
						</a>
					</div>
					<div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
						<span className="font-semibold text-gray-200">Version</span>
						<span className="text-gray-400">1.0.5</span>
					</div>
				</div>

				<p className="text-xs text-gray-500 mt-8 text-center">
					Built with ♥️ and lots of ☕
				</p>
			</div>
		</div>
	);
};

export default InfoModal;