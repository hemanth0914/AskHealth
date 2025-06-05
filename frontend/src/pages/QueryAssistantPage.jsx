import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SAMPLE_QUESTIONS = [
  {
    id: 1,
    question: "What vaccines are due for my child?",
    answer: "Based on your child's records, the following vaccines are due:\n\n• HepB (Hepatitis B) - Due in 2 weeks\n• Rotavirus - Due in 2 weeks\n• Covid20 (Coronavirus Disease 2020) - Due in 2 weeks\n\nPlease consult with your healthcare provider to schedule these vaccinations."
  },
  {
    id: 2,
    question: "How can I access my medical records?",
    answer: "You can access your medical records in several ways:\n\n1. Log in to your patient portal\n2. Contact your healthcare provider directly\n3. Use our mobile app\n4. Visit the hospital's records department\n\nFor immediate access, the patient portal is your best option."
  },
  {
    id: 3,
    question: "When is my next appointment?",
    answer: "Your next scheduled appointments is:\n\n• Healthy - June 19, 2025 at 10:30 AM\n\n\nAppointments are confirmed and reminders will be sent 24 hours before."
  },
  {
    id: 4,
    question: "What are my recent test results?",
    answer: "Your most recent test results from February 2024:\n\n• Blood Pressure: 120/80 (Normal)\n• Cholesterol: 180 mg/dL (Normal)\n• Blood Sugar: 95 mg/dL (Normal)\n\nAll results are within normal ranges. No immediate action required."
  },
  {
    id: 5,
    question: "How do I contact my healthcare provider?",
    answer: "You can reach your healthcare provider through:\n\n• Phone: (555) 123-4567\n• Email: provider@healthcare.com\n• Patient Portal Messaging\n• Emergency After-hours: (555) 999-8888\n\nFor non-emergencies, the patient portal is the preferred method of communication."
  }
];

export default function QueryAssistantPage() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/chat-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          messages: [
            { role: 'user', content: query, timestamp: new Date().toISOString() }
          ] 
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Failed to fetch response');
      }

      const data = await res.json();
      setResponse(data.response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResponse('');
    setError(null);
  };

  const handleSampleQuestion = (question) => {
    setLoading(true);
    setQuery(question.question);
    // Clear previous response while loading
    setResponse('');
    setError(null);

    // Simulate loading delay
    setTimeout(() => {
      setResponse(question.answer);
      setLoading(false);
    }, 2000);
  };

  return (
    <main className="min-h-screen bg-[#f5f5f7]">
      {/* Apple-style sticky header */}
      <header className="sticky top-0 z-50 bg-[#f5f5f7]/80 backdrop-blur-xl">
        <nav className="max-w-[980px] mx-auto px-6">
          <div className="flex items-center justify-between h-[48px]">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm font-medium text-[#1d1d1f] hover:text-[#06c] transition-colors duration-300 flex items-center space-x-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Dashboard</span>
            </button>
          </div>
        </nav>
      </header>

      <div className="max-w-[980px] mx-auto px-6">
        {/* Hero Section */}
        <div className="py-20 text-center">
          <h1 className="text-[56px] font-semibold text-[#1d1d1f] leading-tight tracking-tight">
            Healthcare Assistant
          </h1>
          <p className="mt-4 text-xl text-[#86868b]">
            Ask anything about your healthcare data.
          </p>
        </div>

        <div className="relative flex gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Query Section */}
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="relative">
                <textarea
                  id="query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type your question here"
                  rows={3}
                  className="w-full rounded-lg bg-white/80 backdrop-blur-xl border-0 shadow-sm ring-1 ring-inset ring-[#86868b]/20 placeholder:text-[#86868b] focus:ring-2 focus:ring-inset focus:ring-[#0071e3] px-4 py-3 text-[17px] leading-6 text-[#1d1d1f] transition-shadow duration-200"
                  disabled={loading}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-4 h-[32px] text-sm font-medium text-[#1d1d1f] bg-[#e8e8ed] rounded-full hover:bg-[#d2d2d7] transition-colors duration-300"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="px-6 h-[32px] text-sm font-medium text-white bg-[#0071e3] rounded-full hover:bg-[#0077ED] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                >
                  <span className="relative z-10">
                    {loading ? 'Processing...' : 'Ask Now'}
                  </span>
                  {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0071e3]">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    </div>
                  )}
                </button>
              </div>
            </form>

            {/* Response Section */}
            <div className="mt-12 space-y-6">
              {loading && (
                <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
                  <div className="w-8 h-8 border-2 border-[#0071e3]/30 border-t-[#0071e3] rounded-full animate-spin"></div>
                  <p className="mt-4 text-[15px] text-[#86868b]">Processing your question...</p>
                </div>
              )}
              
              {(response || error) && !loading && (
                <div className="animate-fade-in">
                  <div className="h-px bg-[#d2d2d7]"></div>
                  
                  <div className="pt-6">
                    <h2 className="text-[28px] font-semibold text-[#1d1d1f] mb-6">
                      Response
                    </h2>
                    {error ? (
                      <div className="rounded-lg bg-[#fff2f2] p-4 text-[#e30000]">
                        <p className="text-[15px]">{error}</p>
                      </div>
                    ) : (
                      <div className="rounded-lg bg-white/80 backdrop-blur-xl p-6 text-[17px] leading-relaxed text-[#1d1d1f] shadow-sm ring-1 ring-inset ring-[#86868b]/10">
                        <p className="whitespace-pre-wrap">{response}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Floating Questions Sidebar (now on the right) */}
          <div className="w-80 flex-shrink-0">
            <div className="sticky top-[80px] space-y-3">
              <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-4">Common Questions</h2>
              {SAMPLE_QUESTIONS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSampleQuestion(item)}
                  disabled={loading}
                  className="w-full text-left p-4 rounded-lg bg-white/80 backdrop-blur-xl shadow-sm ring-1 ring-inset ring-[#86868b]/10 hover:bg-white hover:ring-[#86868b]/20 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[15px] text-[#1d1d1f] group-hover:text-[#06c]">
                      {item.question}
                    </p>
                    <svg 
                      className="w-4 h-4 text-[#86868b] group-hover:text-[#06c] group-hover:-translate-x-0.5 transition-all duration-200" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Spacing */}
        <div className="h-20"></div>
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

        .animate-fade-in {
          animation: fade-in 0.7s cubic-bezier(0.41, 0, 0.22, 1);
        }
      `}</style>
    </main>
  );
}
