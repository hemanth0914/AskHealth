import { useState, useEffect } from "react";
import { vapi, startAssistant, stopAssistant } from "../ai"; // Assuming startAssistant will now take mother-child info
import ActiveCallDetails from "../call/ActiveCallDetails";

function ChatBot() {
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  const [loading, setLoading] = useState(false);
  const [assistantIsSpeaking, setAssistantIsSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [callId, setCallId] = useState("");
  const [showThankYou, setShowThankYou] = useState(false);

  const [motherAge, setMotherAge] = useState("");
  const [childAge, setChildAge] = useState("");
  const [healthProblems, setHealthProblems] = useState("");
  const [feedingConcerns, setFeedingConcerns] = useState("");
  const [vaccinationHistory, setVaccinationHistory] = useState("");

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

    try {
      // Start the assistant with mother's and child's information
      console.log("Starting assistant with data:");
      console.log("-----------------------");  
      const data = await startAssistant(motherAge, childAge, healthProblems, vaccinationHistory, feedingConcerns, previousConversationHistory);
      console.log("Assistant started with call ID:", data.id);
      setCallId(data.id);


      
      // Optionally, save this data to your backend or handle as needed
      // await fetch("http://localhost:5001/api/candidates", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({
      //     motherAge,
      //     childAge,
      //     healthProblems,
      //     feedingConcerns,
      //     vaccinationHistory,
      //     callId: data.id,
      //     timestamp: new Date().toISOString(),
      //   }),
      // });
    } catch (error) {
      console.error("Error starting assistant or sending data:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    stopAssistant();
    setFinished(true);
    setShowThankYou(true);
    // Delay the summary fetch to give Vapi time to process the analysis
  setTimeout(async () => {
    try {
      const response = await fetch("http://localhost:8000/fetch-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: "user_123_fake",
          call_id: callId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to fetch summary");
      }

      console.log("Summary received:", data);

      // Optional: set state to show summary on UI
      // setSummary(data.summary);

    } catch (error) {
      console.error("Error fetching call summary:", error);
    }
  }, 10000); // Wait 10 seconds before hitting backend
  };

  const showForm = !loading && !started && !finished;
  const allFieldsFilled = motherAge && childAge && healthProblems && feedingConcerns && vaccinationHistory;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 py-8">
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md space-y-4">
          <h1 className="text-2xl font-bold text-gray-800 text-center">Mother & Child Care Details</h1>
          <input
            type="number"
            placeholder="Mother's Age"
            value={motherAge}
            onChange={handleInputChange(setMotherAge)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="number"
            placeholder="Child's Age"
            value={childAge}
            onChange={handleInputChange(setChildAge)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <textarea
            placeholder="Health Problems (if any)"
            value={healthProblems}
            onChange={handleInputChange(setHealthProblems)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <textarea
            placeholder="Feeding Concerns (e.g., breastfeeding, formula)"
            value={feedingConcerns}
            onChange={handleInputChange(setFeedingConcerns)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <textarea
            placeholder="Vaccination History (if any)"
            value={vaccinationHistory}
            onChange={handleInputChange(setVaccinationHistory)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={handleStart}
            disabled={!allFieldsFilled}
            className={`w-full py-2 rounded-md text-white font-semibold ${
              allFieldsFilled
                ? 'bg-blue-600 hover:bg-blue-700 transition'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Start Call
          </button>
        </div>
      )}

      {showThankYou && (
        <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md mt-6 text-center">
          <h2 className="text-xl font-semibold text-blue-700 mb-2">Thank you for interacting with the assistant!</h2>
          <p className="text-gray-700">We will get back to you shortly with more details.</p>
          <p className="text-gray-500 mt-1">You may now close this window.</p>
        </div>
      )}

      {loading && (
        <div className="text-blue-600 text-lg font-medium mt-4">Preparing your Call...</div>
      )}

      {started && (
        <div className="mt-6 w-full max-w-lg">
          <ActiveCallDetails
            assistantIsSpeaking={assistantIsSpeaking}
            volumeLevel={volumeLevel}
            endCallCallback={handleStop}
          />
        </div>
      )}
    </div>
  );
}

export default ChatBot;
