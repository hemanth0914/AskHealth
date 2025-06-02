const AssistantSpeechIndicator = ({ isSpeaking }) => {
  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        {/* Glow effect */}
        <div className={`absolute inset-0 rounded-full blur-xl transition-opacity duration-700 ${
          isSpeaking ? 'opacity-70' : 'opacity-0'
        } ${isSpeaking ? 'bg-[#0071e3]' : 'bg-transparent'}`} />
        
        {/* Main circle */}
        <div className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500
          ${isSpeaking 
            ? 'bg-gradient-to-br from-[#0071e3] to-[#48aaff] shadow-lg scale-110' 
            : 'bg-[#1d1d1f] scale-100'}`}>
          
          {/* Inner circle */}
          <div className={`w-16 h-16 rounded-full transition-all duration-500
            ${isSpeaking 
              ? 'bg-gradient-to-tr from-[#48aaff] to-[#0071e3] animate-pulse-slow' 
              : 'bg-[#2d2d2f]'}`} />
        </div>
      </div>

      <div className="flex flex-col items-center space-y-1">
        <p className={`text-[15px] font-medium transition-all duration-300 ${
          isSpeaking ? 'text-white' : 'text-[#86868b]'
        }`}>
          {isSpeaking ? 'Assistant Speaking' : 'Assistant Listening'}
        </p>
        <p className="text-[13px] text-[#86868b]">
          {isSpeaking ? 'Please wait...' : 'Waiting for response...'}
        </p>
      </div>

      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1); opacity: 1; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default AssistantSpeechIndicator;
