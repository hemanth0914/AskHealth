import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const [summaries, setSummaries] = useState([]);
  const [upcomingVaccines, setUpcomingVaccines] = useState([]);
  const [nearbyProviders, setNearbyProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [showProvidersModal, setShowProvidersModal] = useState(false);
  const [showImmunizationModal, setShowImmunizationModal] = useState(false);
  const [immunizationSummary, setImmunizationSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userEmail = localStorage.getItem("userEmail");

    if (!token || !userEmail) {
      setTimeout(() => navigate("/login", { replace: true }), 0);
      return;
    }

    const fetchData = async () => {
      try {
        const summariesResponse = await fetch("http://localhost:8000/summaries/", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const summariesData = await summariesResponse.json();
        if (!summariesResponse.ok) throw new Error(summariesData.detail || "Failed to fetch summaries");

        const vaccinesResponse = await fetch("http://localhost:8000/upcoming-vaccines", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const vaccinesData = await vaccinesResponse.json();
        if (!vaccinesResponse.ok) throw new Error(vaccinesData.detail || "Failed to fetch upcoming vaccines");

        setSummaries(summariesData);
        setUpcomingVaccines(vaccinesData);
      } catch (error) {
        alert(error.message);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const fetchNearbyProviders = async () => {
    const token = localStorage.getItem("token");
    setLoadingProviders(true);
    setNearbyProviders([]);
    setShowProvidersModal(true);
    try {
      const res = await fetch("http://localhost:8000/child/nearby-providers", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch providers");
      const data = await res.json();
      setNearbyProviders(data);
    } catch (error) {
      alert(error.message);
      setNearbyProviders([]);
    } finally {
      setLoadingProviders(false);
    }
  };

  const fetchImmunizationSummary = async () => {
    const token = localStorage.getItem("token");
    setLoadingSummary(true);
    setImmunizationSummary(null);
    try {
      const res = await fetch("http://localhost:8000/immunization-summary", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch immunization summary");
      const data = await res.json();
      setImmunizationSummary(data);
      setShowImmunizationModal(true);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoadingSummary(false);
    }
  };

  const navigateToChatBot = () => {
    const userEmail = localStorage.getItem("userEmail");
    navigate('/care');
  };

  const handleLogout = () => {
    localStorage.clear(); // clears all keys (token, email, role
    navigate("/login", { replace: true });
  };

  if (loading) {
    return (
      <div className="text-center mt-10 text-lg text-gray-700">
        Loading data...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 font-sans max-w-screen-xl mx-auto">
      {/* Header */}
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

      {/* Upcoming Vaccinations Section */}
      <section className="mb-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Upcoming Vaccinations (Next 30 Days)</h2>
        {upcomingVaccines.length === 0 ? (
          <p className="text-gray-600">No upcoming vaccinations scheduled.</p>
        ) : (
          <ul className="space-y-3">
            {upcomingVaccines.map(({ first_name, last_name, vaccine_name, next_due_date }, idx) => (
              <li
                key={idx}
                className="p-3 border rounded-md bg-blue-50 flex justify-between items-center cursor-pointer hover:bg-blue-100"
                onClick={fetchNearbyProviders}
                title="Click to see nearby providers"
              >
                <div>
                  <p className="font-medium text-gray-900">{first_name} {last_name}</p>
                  <p className="text-sm text-gray-700">Vaccine: {vaccine_name}</p>
                </div>
                <span className="text-sm text-blue-700 font-semibold">
                  Due on {new Date(next_due_date).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Vaccination History Summary Button */}
      <div className="mb-8 text-center">
        <button
          onClick={fetchImmunizationSummary}
          disabled={loadingSummary}
          className="px-6 py-3 bg-green-600 text-white rounded-lg text-lg font-medium hover:bg-green-700 transition"
        >
          {loadingSummary ? "Loading Summary..." : "Show Vaccination History Summary"}
        </button>
      </div>

      {/* Summaries Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {summaries.map((entry) => (
          <div
          key={entry.call_id}
          className="bg-white text-gray-800 rounded-xl shadow-md p-5 border border-gray-200 hover:shadow-lg flex flex-col"
        >
          <div className="flex justify-between text-sm text-gray-600 font-medium border-b pb-2 mb-4">
            <p>{new Date(entry.startedAt).toLocaleDateString()}</p>
            <p>{new Date(entry.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div className="text-gray-700 text-sm whitespace-pre-wrap text-center">
            {entry.summary || "No summary available."}
          </div>
        </div>
        
        ))}
      </section>

      {/* Start New Care Session Button */}
      <div className="mt-10 text-center">
        <button
          onClick={navigateToChatBot}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg text-lg font-medium hover:bg-blue-700 transition"
        >
          Start New Care Session
        </button>
      </div>

      {/* Nearby Providers Modal */}
      {showProvidersModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center p-4 z-50"
          onClick={() => setShowProvidersModal(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4">Nearby Healthcare Providers</h3>
            {loadingProviders ? (
              <p>Loading providers...</p>
            ) : nearbyProviders.length === 0 ? (
              <p>No providers found nearby.</p>
            ) : (
              <ul className="space-y-4 max-h-80 overflow-auto">
                {nearbyProviders.map((provider) => (
                  <li key={provider.provider_id} className="border-b pb-3 last:border-none">
                    <p className="font-semibold">{provider.provider_name}</p>
                    <p className="text-sm">{provider.specialty || 'General'}</p>
                    <p className="text-sm">{provider.address || 'Address not available'}</p>
                    <p className="text-sm">{provider.pincode}</p>
                    <p className="text-sm">{provider.phone || 'Phone not available'}</p>
                    <p className="text-sm">{provider.email || 'Email not available'}</p>
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={() => setShowProvidersModal(false)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Immunization Summary Modal */}
      {showImmunizationModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex justify-center items-center p-4 z-50"
          onClick={() => setShowImmunizationModal(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-lg w-full shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4">Vaccination History Summary</h3>
            {immunizationSummary ? (
              <>
                <p className="mb-2">
                  <strong>Child:</strong> {immunizationSummary.first_name} {immunizationSummary.last_name}
                </p>
                <p className="whitespace-pre-wrap">{immunizationSummary.summary}</p>
              </>
            ) : (
              <p>Loading summary...</p>
            )}
            <button
              onClick={() => setShowImmunizationModal(false)}
              className="mt-6 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
