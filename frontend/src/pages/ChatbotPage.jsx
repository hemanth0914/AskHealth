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



  const handleStart = async () => {
    setLoading(true);
  
    try {
      const token = localStorage.getItem("token");
      const userEmail = localStorage.getItem("userEmail");
  
      if (!token || !userEmail) {
        alert("User is not authenticated. Please log in.");
        return;
      }
  
      // Step 1: Fetch previous conversation history from the backend
      const response = await fetch(`http://localhost:8000/summaries/${userEmail}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
  
      const previousConversations = await response.json();
  
      if (!response.ok) {
        throw new Error("Failed to fetch previous conversations");
      }
  
      // Step 2: Format previous conversation history
      const previousConversationHistory = previousConversations
        .map((entry) => {
          return `Conversation: 
          Summary: ${entry.summary}. 
          Date: ${new Date(entry.startedAt).toLocaleDateString()}`;
        })
        .join("\n");
  
      console.log("Previous Conversations History:");
      console.log(previousConversationHistory);
  
      // Step 3: Start the assistant with the mother's and child's info along with the previous conversation history
      const data = await startAssistant(
        motherAge,
        childAge,
        healthProblems,
        vaccinationHistory,
        feedingConcerns,
        previousConversationHistory
      );
      console.log("Assistant started with call ID:", data.id);
      setCallId(data.id);
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
        // Step 1: Fetch Call Details from Vapi API
        const callDetailsResponse = await fetch(`https://api.vapi.ai/call/${callId}`, {
          method: "GET",
          headers: {
            "Authorization": "Bearer 44575b30-be10-41f3-9cb3-af859aec0678"
          },
        });

        const callDetails = await callDetailsResponse.json();

        if (!callDetailsResponse.ok) {
          throw new Error("Failed to fetch call details");
        }

        const token = localStorage.getItem("token");
        const userEmail = localStorage.getItem("userEmail");

        // Step 2: Send the details to the backend for summary
        const fetchSummaryResponse = await fetch("http://localhost:8000/fetch-summary", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` // Add JWT token in Authorization header
          },
          body: JSON.stringify({
            user_id: userEmail, // You can replace with actual user_id
            call_id: callId,
            summary: callDetails.summary,  // Assuming `summary` is available in the response
            startedAt: callDetails.startedAt,  // Assuming `startedAt` is available in the response
            endedAt: callDetails.endedAt   // Assuming `endedAt` is available in the response
          })
        });

        const data = await fetchSummaryResponse.json();

        if (!fetchSummaryResponse.ok) {
          throw new Error(data.detail || "Failed to fetch summary");
        }

        console.log("Summary received:", data);

        // Optionally, set state to show summary on UI
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
