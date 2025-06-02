import { useState, useEffect } from "react";
import { vapi, startAssistant, stopAssistant } from "../ai";
import ActiveCallDetails from "../call/ActiveCallDetails";
import { useNavigate } from "react-router-dom";

function ChatBot() {
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assistantIsSpeaking, setAssistantIsSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [callId, setCallId] = useState("");
  const [showThankYou, setShowThankYou] = useState(false);
  const [initializationStep, setInitializationStep] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    // Block browser back/forward navigation
    window.history.pushState(null, document.title, window.location.href);

    const onPopState = (e) => {
      window.history.pushState(null, document.title, window.location.href);
      alert("Navigation using browser back/forward buttons is disabled on this page.");
    };

    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

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
        setInitializationStep(1);
        const token = localStorage.getItem("token");

        if (!token) {
          alert("You need to log in first.");
          return;
        }

        setInitializationStep(2);
        const response = await fetch("http://localhost:8000/summaries/", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const history = await response.json();
        const previousConversationHistory = history
          .map((entry) => `Summary: ${entry.summary}. Date: ${new Date(entry.startedAt).toLocaleDateString()}`)
          .join("\n");

        setInitializationStep(3);
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
    }, 1000); // 1-second buffer

    return () => clearTimeout(timer);
  }, []);

  const handleStop = async () => {
    stopAssistant();
    setShowThankYou(true);

    // Redirect to dashboard after 5 seconds
    setTimeout(() => {
      navigate("/dashboard");
    }, 5000);

    setTimeout(async () => {
      try {
        const callDetailsResponse = await fetch(`https://api.vapi.ai/call/${callId}`, {
          method: "GET",
          headers: {
            Authorization: "Bearer 44575b30-be10-41f3-9cb3-af859aec0678",
          },
        });

        const callDetails = await callDetailsResponse.json();
        if (!callDetailsResponse.ok) throw new Error("Failed to fetch call details");

        const token = localStorage.getItem("token");

        const storeSummaryResponse = await fetch("http://localhost:8000/store-summary", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: callId,
            summary: callDetails.summary || "",
            startedAt: callDetails.startedAt,
            endedAt: callDetails.endedAt,
            recordingUrl: callDetails.recordingUrl,
            stereoRecordingUrl: callDetails.stereoRecordingUrl,
            transcript: callDetails.transcript,
            status: callDetails.status,
            endedReason: callDetails.endedReason
          }),
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
    <main className="min-h-screen bg-[#f5f5f7]">
      {/* Apple-style sticky header */}
      <header className="sticky top-0 z-50 bg-[#f5f5f7]/80 backdrop-blur-xl">
        <nav className="max-w-[980px] mx-auto px-6">
          <div className="flex items-center justify-between h-[48px]">
            <h1 className="text-[17px] font-semibold text-[#1d1d1f]">
              Healthcare Assistant
            </h1>
          </div>
        </nav>
      </header>

      <div className="max-w-[980px] mx-auto px-6 py-12">
        <div className="flex flex-col items-center">
          {loading && (
            <div className="w-full max-w-lg">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-[#86868b]/10 shadow-sm p-8 animate-fade-in">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 mb-6 relative">
                    <div className="absolute inset-0 bg-[#0071e3] rounded-full opacity-20 animate-ping"></div>
                    <div className="relative w-full h-full border-2 border-[#0071e3]/30 border-t-[#0071e3] rounded-full animate-spin"></div>
                  </div>
                  <h2 className="text-[28px] font-semibold text-[#1d1d1f] mb-4">
                    Preparing Your Care Session
                  </h2>
                  <div className="space-y-2">
                    <p className={`text-[15px] ${initializationStep >= 1 ? 'text-[#1d1d1f]' : 'text-[#86868b]'}`}>
                      ○ Initializing assistant...
                    </p>
                    <p className={`text-[15px] ${initializationStep >= 2 ? 'text-[#1d1d1f]' : 'text-[#86868b]'}`}>
                      ○ Loading conversation history...
                    </p>
                    <p className={`text-[15px] ${initializationStep >= 3 ? 'text-[#1d1d1f]' : 'text-[#86868b]'}`}>
                      ○ Establishing secure connection...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {started && (
            <div className="w-full max-w-lg animate-fade-in">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-[#86868b]/10 shadow-sm p-8">
                <ActiveCallDetails
                  assistantIsSpeaking={assistantIsSpeaking}
                  volumeLevel={volumeLevel}
                  endCallCallback={handleStop}
                />
              </div>
            </div>
          )}

          {showThankYou && (
            <div className="w-full max-w-lg mt-6 animate-fade-in">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-[#86868b]/10 shadow-sm p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-[#0071e3] rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-[28px] font-semibold text-[#1d1d1f] mb-4">
                  Thank You!
                </h2>
                <p className="text-[17px] text-[#86868b]">
                  Your care session has been completed successfully. Redirecting you to the dashboard...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Apple-style animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.7s cubic-bezier(0.41, 0, 0.22, 1);
        }

        .animate-ping {
          animation: ping 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </main>
  );
}

export default ChatBot;
