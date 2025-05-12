const AssistantSpeechIndicator = ({ isSpeaking }) => {
  return (
    <div className="flex flex-col items-center space-y-2">
      <div
        className={`w-24 h-24 rounded-full transition-all duration-300
          ${isSpeaking ? "bg-gradient-to-tr from-orange-400 to-red-600 shadow-lg" : "bg-gray-700"}`}
      ></div>
      <p className="text-sm text-gray-300">
        {isSpeaking ? "Assistant Speaking" : "Assistant Not Speaking"}
      </p>
    </div>
  );
};

export default AssistantSpeechIndicator;
