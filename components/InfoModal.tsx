import React from 'react';
import { APP_VERSION, LOGO_URL } from '../constants';

interface InfoModalProps {
	isOpen: boolean;
	onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
			onClick={onClose}
			aria-modal="true"
			role="dialog"
		>
			<style>{`
				@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
				.animate-fade-in { animation: fade-in 0.3s ease-out forwards; }

				@keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
				.animate-scale-in { animation: scale-in 0.3s ease-out forwards; }

                /* New "Chromatic Blob" glow animations */
                @keyframes pulse-glow {
                    0%, 100% { transform: scale(1); opacity: 0.5; }
                    50% { transform: scale(1.15); opacity: 0.3; }
                }
                @keyframes chromatic-shift-1 {
                    0%   { transform: translate(6px, -4px) scale(1.0); }
                    25%  { transform: translate(-5px, 5px) scale(0.95); }
                    50%  { transform: translate(4px, 6px) scale(1.05); }
                    75%  { transform: translate(-5px, -5px) scale(1.0); }
                    100% { transform: translate(6px, -4px) scale(1.0); }
                }
                @keyframes chromatic-shift-2 {
                    0%   { transform: translate(-6px, 4px) scale(1.05); }
                    25%  { transform: translate(5px, -5px) scale(1.0); }
                    50%  { transform: translate(-4px, -6px) scale(0.95); }
                    75%  { transform: translate(5px, 5px) scale(1.0); }
                    100% { transform: translate(-6px, 4px) scale(1.05); }
                }
                .animate-pulse-glow { animation: pulse-glow 12s infinite ease-in-out; }
                .animate-chromatic-shift-1 { animation: chromatic-shift-1 8s infinite ease-in-out; }
                .animate-chromatic-shift-2 { animation: chromatic-shift-2 10s infinite ease-in-out alternate; }
			`}</style>

			<div
				className="relative w-full max-w-2xl p-6 sm:p-8 mx-4 bg-[#10121a] border border-white/10 rounded-2xl shadow-2xl text-white animate-scale-in"
				onClick={(e) => e.stopPropagation()}
			>
                <div className="relative text-center mb-4">
                    <h2 className="text-3xl font-bold blur-text-container font-josefin-sans">
						{'Etherfields'.split('').map((char, index) => (
							<span key={index}>{char === ' ' ? '\u00A0' : char}</span>
						))}
					</h2>
                    <button
                        onClick={onClose}
                        className="absolute top-1/2 right-0 transform -translate-y-1/2 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        aria-label="Close"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
				
                <div className="flex justify-center my-10">
                    <div className="relative w-36 h-36 flex items-center justify-center">
                        {/* Glow Elements for a cinematic "chromatic blob" effect */}
                        {/* A soft, larger, pulsing base glow */}
                        <div className="absolute w-full h-full rounded-full bg-violet-500 blur-2xl animate-pulse-glow"></div>
                        
                        {/* Two smaller-blurred, shifting layers to create chromatic aberration */}
                        <div className="absolute w-full h-full rounded-full bg-pink-500 blur-xl opacity-80 animate-chromatic-shift-1"></div>
                        <div className="absolute w-full h-full rounded-full bg-blue-500 blur-xl opacity-70 animate-chromatic-shift-2" style={{ animationDelay: '-5s' }}></div>
                        
                        {/* Logo Image */}
                        <img src={LOGO_URL} alt="Etherfields Logo" className="relative w-full h-full z-10" />
                    </div>
                </div>

				<p className="text-gray-300 mb-10 text-center text-sm leading-relaxed">
					Etherfields is a small ambient sound designer in your browser. 
					Pick a base atmosphere, layer in environmental sounds, and blend them together until it feels right.
				</p>

				<div className="space-y-3">
					<div className="flex justify-between items-center p-4 bg-[#1c1e2a] rounded-lg">
						<span className="font-semibold text-gray-300 text-sm">Follow on YouTube</span>
						<a
							href="https://www.youtube.com/@etherfields_app"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold bg-[#2a2d3a] text-white rounded-lg hover:bg-[#3c4052] transition-colors"
						>
							<i className="fa-brands fa-youtube text-red-500"></i>
							<span>Follow</span>
						</a>
					</div>
					<div className="flex justify-between items-center p-4 bg-[#1c1e2a] rounded-lg">
						<span className="font-semibold text-gray-300 text-sm">Support Me</span>
						<a
                            href="https://ko-fi.com/K3K019YFF8"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-bold text-slate-800 bg-[#C5BFFF] rounded-lg shadow-sm hover:bg-opacity-90 transition"
                        >
                           <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.9 2-2V5c0-1.11-.89-2-2-2zm-4 10c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V5h10v8zm4-5h-2V5h2v3z"></path></svg>
                            Buy me a coffee
                        </a>
					</div>
					<div className="flex justify-between items-center p-4 bg-[#1c1e2a] rounded-lg">
						<span className="font-semibold text-gray-300 text-sm">Contact</span>
						<a
							href="mailto:hello@unableton.com"
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
						>
							hello[at]unableton.com
						</a>
					</div>
					<div className="flex justify-between items-center p-4 bg-[#1c1e2a] rounded-lg">
						<span className="font-semibold text-gray-300 text-sm">Version</span>
						<span className="text-gray-400 text-sm">{APP_VERSION}</span>
					</div>
				</div>
			</div>
		</div>
	);
};

export default InfoModal;