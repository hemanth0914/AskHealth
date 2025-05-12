import { useState, useEffect } from "react";
import { vapi, startAssistant, stopAssistant } from "./ai";
import ActiveCallDetails from "./call/ActiveCallDetails";

function ChatBot() {
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assistantIsSpeaking, setAssistantIsSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [callId, setCallId] = useState("");

  const [motherAge, setMotherAge] = useState("");
  const [childAge, setChildAge] = useState("");
  const [health_problems, setHealthProblems] = useState("");
  const [vaccination_history, setVaccinationHistory] = useState("");
  const [feedingConcerns, setFeedingConcerns] = useState("");
  
  const [loadingResult, setLoadingResult] = useState(false);
  const [callResult, setCallResult] = useState(null);

  useEffect(() => {
    vapi
      .on("call-start", () => {
        setLoading(false);
        setStarted(true);
      })
      .on("call-end", () => {
        setStarted(false);
        setLoading(false);
      })
      .on("speech-start", () => {
        setAssistantIsSpeaking(true);
      })
      .on("speech-end", () => {
        setAssistantIsSpeaking(false);
      })
      .on("volume-level", (level) => {
        setVolumeLevel(level);
      });
  }, []);

  const handleInputChange = (setter) => (event) => {
    setter(event.target.value);
  };

  const previousConversationHistory = "Conversation-1: The mother is 30 years old and the child is 5 years old. The child has no health problems and has received all vaccinations. The mother is concerned about the child's feeding habits. Conversation - 2: The child has asthma and has received all vaccinations. The mother is concerned about the child's feeding habits.";

  const handleStart = async () => {
    setLoading(true);
    console.log("previousConversationHistory", previousConversationHistory);
    const data = await startAssistant(motherAge, childAge, health_problems, vaccination_history, feedingConcerns, previousConversationHistory);
    setCallId(data.id);
  };

  const handleStop = () => {
    stopAssistant();
    getCallDetails();
  };

  const getCallDetails = (interval = 3000) => {
    setLoadingResult(true);
    fetch("/call-details?call_id=" + callId)
      .then((response) => response.json())
      .then((data) => {
        if (data.analysis && data.summary) {
          setCallResult(data); // Store the result of the calll
        } else {
          setTimeout(() => getCallDetails(interval), interval);
        }
      })
      .catch((error) => alert(error));
  };

  const showForm = !loading && !started && !loadingResult && !callResult;
  const allFieldsFilled = motherAge && childAge && health_problems && vaccination_history && feedingConcerns;

  return (
    <div className="app-container">
      {showForm && (
        <>
          <h1>Details (Required)</h1>
          <input
            type="text"
            placeholder="Mother's Age"
            value={motherAge}
            className="input-field"
            onChange={handleInputChange(setMotherAge)}
          />
          <input
            type="text"
            placeholder="Child's Age"
            value={childAge}
            className="input-field"
            onChange={handleInputChange(setChildAge)}
          />
          <input
            type="text"
            placeholder="Health Problems"
            value={health_problems}
            className="input-field"
            onChange={handleInputChange(setHealthProblems)}
          />
          <input
            type="text"
            placeholder="Vaccination History"
            value={vaccination_history}
            className="input-field"
            onChange={handleInputChange(setVaccinationHistory)}
          />
          <input
            type="text"
            placeholder="Feeding Concerns"
            value={feedingConcerns}
            className="input-field"
            onChange={handleInputChange(setFeedingConcerns)}
          />
          {!started && (
            <button
              onClick={handleStart}
              disabled={!allFieldsFilled}
              className="button"
            >
              Start Call
            </button>
          )}
        </>
      )}
      {loadingResult && <p>Loading call details... please wait</p>}
      {!loadingResult && callResult && (
        <div className="call-result">
          <p>Qualified: {callResult.analysis.structuredData.is_qualified.toString()}</p>
          <p>{callResult.summary}</p>
        </div>
      )}
      {(loading || loadingResult) && <div className="loading"></div>}
      {started && (
        <ActiveCallDetails
          assistantIsSpeaking={assistantIsSpeaking}
          volumeLevel={volumeLevel}
          endCallCallback={handleStop}
        />
      )}
    </div>
  );
}

export default ChatBot;
