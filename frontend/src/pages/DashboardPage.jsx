import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check if the user is already logged in (token and userEmail should be in localStorage)
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userEmail = localStorage.getItem("userEmail");

    if (!token || !userEmail) {
      // If not logged in, redirect to login page
      navigate("/login");
      return;
    }
 
    const fetchSummaries = async () => {
      try {
        const response = await fetch(`http://localhost:8000/summaries/${userEmail}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await response.json();
        if (response.ok) {
          setSummaries(data);
        } else {
          alert(data.detail || "Session expired. Please login again.");
          navigate("/login");
        }
      } catch (error) {
        console.error("Error fetching summaries:", error);
        alert("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSummaries();
  }, [navigate]);

  const navigateToChatBot = () => {
    const userEmail = localStorage.getItem("userEmail");
    navigate('/care', { state: { userEmail } });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  if (loading) {
    return <div className="text-center mt-10 text-lg text-gray-700">Loading summaries...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 font-sans max-w-screen-xl mx-auto">
      <header className="bg-blue-600 shadow-md sticky top-0 z-10 rounded-lg mb-6">
        <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center justify-between border-b border-blue-700 rounded-lg">
          <h1 className="text-3xl font-bold text-white">Mother & Child Care Dashboard</h1>
          <button
            onClick={handleLogout}
            className="text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm"
          >
            Logout
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {summaries.map((entry) => (
          <div
            key={entry.call_id}
            className="bg-white text-gray-800 rounded-xl shadow-md p-5 border border-gray-200 transition hover:shadow-lg flex flex-col justify-between"
          >
            <div className="flex justify-between text-sm text-gray-600 font-medium mb-4 border-b pb-2">
              <p>{new Date(entry.startedAt).toLocaleDateString()}</p>
              <p>{new Date(entry.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div className="text-gray-700 text-sm whitespace-pre-wrap">
              {entry.summary || "No summary available."}
            </div>
          </div>
        ))}
      </section>

      <div className="mt-10 text-center">
        <button
          onClick={navigateToChatBot}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg text-lg font-medium hover:bg-blue-700 transition"
        >
          Start New Care Session
        </button>
      </div>
    </main>
  );
}
