import AssistantSpeechIndicator from "./AssistantSpeechIndicator";
import VolumeLevel from "./VolumeLevel";

const ActiveCallDetails = ({
  assistantIsSpeaking,
  volumeLevel,
  endCallCallback,
}) => {
  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="relative w-full">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0071e3]/10 to-transparent rounded-3xl blur-xl"></div>
        <div className="relative bg-[#1d1d1f] backdrop-blur-xl rounded-3xl p-8 flex flex-col items-center space-y-8 border border-white/10">
          <div className="flex flex-col items-center space-y-6">
            <AssistantSpeechIndicator isSpeaking={assistantIsSpeaking} />
            <VolumeLevel volume={volumeLevel} />
          </div>

          <div className="w-full flex justify-center">
            <button
              onClick={endCallCallback}
              className="group relative px-8 py-3 bg-[#ff453a] rounded-full text-[15px] font-medium text-white 
                       hover:bg-[#ff5146] active:bg-[#d93d33] transition-all duration-300 
                       shadow-lg hover:shadow-xl active:shadow-md transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/10 to-transparent"></span>
              End Session
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-subtle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
      `}</style>
    </div>
  );
};

export default ActiveCallDetails;
