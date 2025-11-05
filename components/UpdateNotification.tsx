import React from 'react';

interface UpdateNotificationProps {
  onUpdate: () => void;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({ onUpdate }) => {
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between gap-4 w-auto max-w-[90%] p-3 bg-gray-900/70 border border-white/20 rounded-xl shadow-2xl text-white backdrop-blur-md animate-slide-in-up"
      role="alert"
    >
      <style>{`
        @keyframes slide-in-up { 
          from { transform: translate(-50%, 100px); opacity: 0; } 
          to { transform: translate(-50%, 0); opacity: 1; } 
        }
        .animate-slide-in-up { animation: slide-in-up 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
      `}</style>
      <p className="text-sm">A new version is available!</p>
      <button
        onClick={onUpdate}
        className="shine-hover flex-shrink-0 px-4 py-1.5 text-sm font-semibold bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors ring-1 ring-inset ring-white/20"
      >
        Refresh to Update
      </button>
    </div>
  );
};

export default UpdateNotification;
