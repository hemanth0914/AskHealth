import { useState, useEffect } from "react";
import { vapi, startAssistant, stopAssistant } from "../ai";
import ActiveCallDetails from "../call/ActiveCallDetails";

function ChatBot() {
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assistantIsSpeaking, setAssistantIsSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [callId, setCallId] = useState("");
  const [showThankYou, setShowThankYou] = useState(false);

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
      .on("speech-start", () => setAssistantIsSpeaking(true))
      .on("speech-end", () => setAssistantIsSpeaking(false))
      .on("volume-level", (level) => setVolumeLevel(level));
  }, []);

  // Retry loop to wait for valid assistant ID
  const waitForAssistantId = async (previousConversationHistory, maxAttempts = 5, delay = 1000) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const data = await startAssistant(previousConversationHistory);

      if (data && (data.id || data.call?.id)) {
        const id = data.id || data.call.id;
        console.log("✅ Assistant ready with call ID:", id);
        return id;
      }

      console.warn(`⏳ Attempt ${attempt}: Waiting for assistant ID...`);
      await new Promise((res) => setTimeout(res, delay));
    }

    throw new Error("Assistant did not return a valid ID after multiple attempts.");
  };

  useEffect(() => {
    const initCall = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch("http://localhost:8000/summaries/", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const history = await response.json();
        const previousConversationHistory = history
          .map((entry) => `Summary: ${entry.summary}. Date: ${new Date(entry.startedAt).toLocaleDateString()}`)
          .join("\n");

        const id = await waitForAssistantId(previousConversationHistory);
        setCallId(id);
        console.log("📞 Assistant started with call ID:", id);

      } catch (err) {
        console.error("❌ Call setup failed:", err);
        alert("Call could not be started.");
      }
    };

    const timer = setTimeout(() => {
      initCall();
    }, 1000); // 5-second buffer

    return () => clearTimeout(timer);
  }, []);

  const handleStop = async () => {
    stopAssistant();
    setShowThankYou(true);
  
    setTimeout(async () => {
      try {
        const callDetailsResponse = await fetch(`https://api.vapi.ai/call/${callId}`, {
          method: "GET",
          headers: {
            "Authorization": "Bearer 44575b30-be10-41f3-9cb3-af859aec0678"
          },
        });
  
        const callDetails = await callDetailsResponse.json();
        if (!callDetailsResponse.ok) throw new Error("Failed to fetch call details");
  
        const token = localStorage.getItem("token");
  
        const storeSummaryResponse = await fetch("http://localhost:8000/store-summary", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            call_id: callId,
            summary: callDetails.summary,
            startedAt: callDetails.startedAt,
            endedAt: callDetails.endedAt
          })
        });
  
        if (!storeSummaryResponse.ok) {
          const err = await storeSummaryResponse.json();
          throw new Error(err.detail || "Failed to store summary");
        }
  
        console.log("✅ Summary stored successfully");
  
      } catch (error) {
        console.error("Error storing call summary:", error.message);
      }
    }, 10000); // wait 10s after assistant stops
  };
  

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 py-8">
      {loading && (
        <div className="text-blue-600 text-lg font-medium mt-4">
          Preparing your Care Session...
        </div>
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

      {showThankYou && (
        <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md mt-6 text-center">
          <h2 className="text-xl font-semibold text-blue-700 mb-2">Thank you for interacting with the assistant!</h2>
          <p className="text-gray-500 mt-1">You may now close this window.</p>
        </div>
      )}
    </div>
  );
}

export default ChatBot;


