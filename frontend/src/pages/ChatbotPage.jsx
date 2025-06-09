import React, { useState, useEffect } from "react";
import { vapi, startAssistant, stopAssistant } from "../ai";
import ActiveCallDetails from "../call/ActiveCallDetails";
import { useNavigate, useBeforeUnload } from "react-router-dom";

// Common symptom patterns to look for in the transcript
const SYMPTOM_PATTERNS = [
  { name: "fever", keywords: ["fever", "temperature", "hot", "chills"] },
  { name: "cough", keywords: ["cough", "coughing", "dry cough", "wet cough"] },
  { name: "headache", keywords: ["headache", "head pain", "migraine"] },
  { name: "sore throat", keywords: ["sore throat", "throat pain", "difficulty swallowing"] },
  { name: "runny nose", keywords: ["runny nose", "nasal congestion", "stuffy nose"] },
  { name: "fatigue", keywords: ["fatigue", "tired", "exhausted", "low energy"] },
  { name: "body ache", keywords: ["body ache", "muscle pain", "joint pain"] },
  { name: "nausea", keywords: ["nausea", "vomiting", "sick to stomach"] },
  { name: "diarrhea", keywords: ["diarrhea", "loose stool"] },
  { name: "shortness of breath", keywords: ["shortness of breath", "difficulty breathing", "breathless"] }
];

// Severity patterns to look for
const SEVERITY_PATTERNS = {
  high: ["severe", "intense", "very", "extremely", "worst", "unbearable"],
  moderate: ["moderate", "medium", "somewhat", "quite"],
  mild: ["mild", "slight", "little", "minor"]
};

// Duration patterns to look for
const DURATION_PATTERNS = [
  /(\d+)\s*(day|days|week|weeks|hour|hours)/i,
  /(few|couple of|several)\s*(day|days|week|weeks|hour|hours)/i,
  /(since|for)\s*(yesterday|morning|afternoon|evening|tonight)/i
];

function extractSymptomsFromTranscript(transcript) {
  const symptoms = [];
  const lowerTranscript = transcript.toLowerCase();

  // Helper function to find severity
  const findSeverity = (context) => {
    for (const [level, patterns] of Object.entries(SEVERITY_PATTERNS)) {
      if (patterns.some(pattern => context.includes(pattern))) {
        return level;
      }
    }
    return null;
  };

  // Helper function to find duration
  const findDuration = (context) => {
    for (const pattern of DURATION_PATTERNS) {
      const match = context.match(pattern);
      if (match) {
        return match[0];
      }
    }
    return null;
  };

  // Check for each symptom pattern
  SYMPTOM_PATTERNS.forEach(symptomPattern => {
    for (const keyword of symptomPattern.keywords) {
      if (lowerTranscript.includes(keyword)) {
        // Get the context (20 words before and after the symptom mention)
        const words = lowerTranscript.split(/\s+/);
        const keywordIndex = words.findIndex(word => word.includes(keyword));
        if (keywordIndex !== -1) {
          const start = Math.max(0, keywordIndex - 20);
          const end = Math.min(words.length, keywordIndex + 20);
          const context = words.slice(start, end).join(" ");

          symptoms.push({
            name: symptomPattern.name,
            severity: findSeverity(context),
            duration: findDuration(context),
            context: context
          });
          break; // Break after finding first mention of this symptom
        }
      }
    }
  });

  return symptoms;
}

function ChatBot() {
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assistantIsSpeaking, setAssistantIsSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [callId, setCallId] = useState("");
  const [showThankYou, setShowThankYou] = useState(false);
  const [initializationStep, setInitializationStep] = useState(1);
  const navigate = useNavigate();

  // Handle page refresh/close during active call
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (started) {
        e.preventDefault();
        e.returnValue = "You have an active call. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [started]);

  // Block navigation during active call
  useEffect(() => {
    const blockNavigation = () => {
      if (started) {
        const confirmLeave = window.confirm(
          "You have an active call. Are you sure you want to leave? The call will be ended."
        );
        if (confirmLeave) {
          stopAssistant();
          return true;
        }
        return false;
      }
      return true;
    };

    // Block browser back/forward navigation
    window.history.pushState(null, document.title, window.location.href);
    const handlePopState = (e) => {
      if (!blockNavigation()) {
        window.history.pushState(null, document.title, window.location.href);
      }
    };

    window.addEventListener("popstate", handlePopState);

    // Block navigation through router
    const unblock = navigate((nextLocation) => {
      if (blockNavigation()) {
        return true;
      }
      return false;
    });

    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (unblock) unblock();
    };
  }, [started, navigate]);

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
            call_id: callId,
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

        // Analyze symptoms from transcript
        if (callDetails.transcript) {
          // Extract symptoms from transcript
          const symptoms = extractSymptomsFromTranscript(callDetails.transcript);
          
          const analyzeResponse = await fetch("http://localhost:8000/analyze-symptoms", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              callId: callId,
              symptoms: symptoms
            }),
          });

          if (!analyzeResponse.ok) {
            const errorData = await analyzeResponse.json().catch(() => ({}));
            console.error("Failed to analyze symptoms:", errorData);
            throw new Error("Failed to analyze symptoms: " + (errorData.detail || "Unknown error"));
          }

          // Check for potential health risks
          const healthAlertsResponse = await fetch("http://localhost:8000/check-health-alerts", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!healthAlertsResponse.ok) {
            throw new Error("Failed to check health alerts");
          }

          const alertsData = await healthAlertsResponse.json();
          if (alertsData.alerts && alertsData.alerts.length > 0) {
            console.log("🚨 Health alerts detected:", alertsData.alerts);
          }
        }
      } catch (error) {
        console.error("Error storing call summary:", error.message);
      }
    }, 10000); // wait 10s after assistant stops
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f5f5f7] to-[#fff]">
      {/* Refined Apple-style header with blur effect */}
      <header className="sticky top-0 z-50 bg-[#f5f5f7]/80 backdrop-blur-xl border-b border-[#86868b]/10">
        <nav className="max-w-[980px] mx-auto px-6">
          <div className="flex items-center justify-between h-[44px]">
            <h1 className="text-[17px] font-semibold text-[#1d1d1f] tracking-tight">
              Healthcare Assistant
            </h1>
            {started && (
              <button
                onClick={handleStop}
                className="text-[13px] font-medium text-[#0071e3] hover:text-[#0077ed] transition-colors"
              >
                End Session
              </button>
            )}
          </div>
        </nav>
      </header>

      <div className="max-w-[980px] mx-auto px-6 py-12">
        <div className="flex flex-col items-center space-y-6">
          {/* Loading State with Apple-style animations */}
          {loading && (
            <div className="w-full max-w-lg transform transition-all duration-700 ease-out">
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-[#86868b]/10 shadow-lg p-8 animate-float">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 mb-8 relative">
                    <div className="absolute inset-0 bg-[#0071e3] rounded-full opacity-20 animate-pulse"></div>
                    <div className="relative w-full h-full border-2 border-[#0071e3]/30 border-t-[#0071e3] rounded-full animate-spin"></div>
                  </div>
                  <h2 className="text-[28px] font-semibold text-[#1d1d1f] mb-6 tracking-tight">
                    Preparing Your Care Session
                  </h2>
                  <div className="space-y-4">
                    <div className={`flex items-center space-x-3 transition-all duration-500 ${initializationStep >= 1 ? 'opacity-100' : 'opacity-50'}`}>
                      <div className={`w-2 h-2 rounded-full ${initializationStep >= 1 ? 'bg-[#0071e3]' : 'bg-[#86868b]'}`} />
                      <p className="text-[15px] text-[#1d1d1f]">Initializing assistant</p>
                    </div>
                    <div className={`flex items-center space-x-3 transition-all duration-500 ${initializationStep >= 2 ? 'opacity-100' : 'opacity-50'}`}>
                      <div className={`w-2 h-2 rounded-full ${initializationStep >= 2 ? 'bg-[#0071e3]' : 'bg-[#86868b]'}`} />
                      <p className="text-[15px] text-[#1d1d1f]">Loading conversation history</p>
                    </div>
                    <div className={`flex items-center space-x-3 transition-all duration-500 ${initializationStep >= 3 ? 'opacity-100' : 'opacity-50'}`}>
                      <div className={`w-2 h-2 rounded-full ${initializationStep >= 3 ? 'bg-[#0071e3]' : 'bg-[#86868b]'}`} />
                      <p className="text-[15px] text-[#1d1d1f]">Establishing secure connection</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Call State with enhanced visuals */}
          {started && (
            <div className="w-full max-w-lg transform transition-all duration-700 ease-out animate-float">
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-[#86868b]/10 shadow-lg p-8">
                <ActiveCallDetails
                  assistantIsSpeaking={assistantIsSpeaking}
                  volumeLevel={volumeLevel}
                  endCallCallback={handleStop}
                />
              </div>
            </div>
          )}

          {/* Thank You State with refined animations */}
          {showThankYou && (
            <div className="w-full max-w-lg transform transition-all duration-700 ease-out animate-float">
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-[#86868b]/10 shadow-lg p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-[#0071e3] to-[#0077ed] rounded-full flex items-center justify-center animate-bounce-subtle">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-[32px] font-semibold text-[#1d1d1f] mb-4 tracking-tight">
                  Thank You
                </h2>
                <p className="text-[17px] text-[#86868b] leading-relaxed">
                  Your care session has been completed successfully. 
                  <br />
                  Redirecting you to the dashboard...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced animations */}
      <style jsx>{`
        @keyframes float {
          0% {
            transform: translateY(10px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(-5%);
          }
          50% {
            transform: translateY(5%);
          }
        }

        .animate-float {
          animation: float 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }

        .transition-all {
          transition-property: all;
          transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
          transition-duration: 0.5s;
        }
      `}</style>
    </main>
  );
}

export default ChatBot;
