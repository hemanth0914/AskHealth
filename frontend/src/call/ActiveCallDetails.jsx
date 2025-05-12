import AssistantSpeechIndicator from "./AssistantSpeechIndicator";
import VolumeLevel from "./VolumeLevel";

const ActiveCallDetails = ({
  assistantIsSpeaking,
  volumeLevel,
  endCallCallback,
}) => {
  return (
    <div className="bg-black text-white w-full rounded-xl p-6 flex flex-col items-center space-y-6 shadow-xl">
      <div className="flex flex-col items-center space-y-6">
        <AssistantSpeechIndicator isSpeaking={assistantIsSpeaking} />
        <VolumeLevel volume={volumeLevel} />
      </div>

      <div className="mt-5">
        <button
          onClick={endCallCallback}
          className="px-6 py-3 bg-orange-600 text-white rounded-full text-lg font-semibold hover:bg-orange-700 transition-colors duration-300"
        >
          End Call
        </button>
      </div>
    </div>
  );
};

export default ActiveCallDetails;
