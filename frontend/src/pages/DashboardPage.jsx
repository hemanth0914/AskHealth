import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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

  const [diseaseOutbreak, setDiseaseOutbreak] = useState([]);
  const [loadingDiseaseOutbreak, setLoadingDiseaseOutbreak] = useState(false);

  // Vaccine modal states
  const [showVaccineModal, setShowVaccineModal] = useState(false);
  const [selectedVaccine, setSelectedVaccine] = useState(null);

  // Appointment scheduling inside vaccine modal
  const [showScheduleSection, setShowScheduleSection] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState(null);
  const [selectedProviderId, setSelectedProviderId] = useState(null);
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);
  const [nearbyProvidersForSchedule, setNearbyProvidersForSchedule] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userEmail = localStorage.getItem("userEmail");

    if (!token || !userEmail) {
      setTimeout(() => navigate("/login", { replace: true }), 0);
      return;
    }

    async function fetchData() {
      try {
        const [summariesRes, vaccinesRes] = await Promise.all([
          fetch("http://localhost:8000/summaries/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:8000/upcoming-vaccines", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!summariesRes.ok) throw new Error("Failed to fetch summaries");
        if (!vaccinesRes.ok) throw new Error("Failed to fetch upcoming vaccines");

        const summariesData = await summariesRes.json();
        const vaccinesData = await vaccinesRes.json();

        setSummaries(summariesData);
        setUpcomingVaccines(vaccinesData);
      } catch (err) {
        alert(err.message);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [navigate]);

  // Fetch nearby providers modal (existing)
  const fetchNearbyProviders = async () => {
    const token = localStorage.getItem("token");
    setLoadingProviders(true);
    setNearbyProviders([]);
    setShowProvidersModal(true);

    try {
      const res = await fetch("http://localhost:8000/child/nearby-providers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch providers");
      const data = await res.json();
      setNearbyProviders(data);
    } catch (err) {
      alert(err.message);
      setNearbyProviders([]);
    } finally {
      setLoadingProviders(false);
    }
  };

  // Fetch immunization summary modal (existing)
  const fetchImmunizationSummary = async () => {
    const token = localStorage.getItem("token");
    setLoadingSummary(true);
    setImmunizationSummary(null);
    try {
      const res = await fetch("http://localhost:8000/immunization-summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch immunization summary");
      const data = await res.json();
      setImmunizationSummary(data);
      setShowImmunizationModal(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingSummary(false);
    }
  };

  // Fetch disease outbreaks (existing)
  const fetchDiseaseOutbreak = async () => {
    const token = localStorage.getItem("token");
    setLoadingDiseaseOutbreak(true);

    try {
      const res = await fetch("http://localhost:8000/disease-outbreak", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch disease outbreaks");
      const data = await res.json();
      setDiseaseOutbreak(data);
    } catch (err) {
      alert(err.message);
      setDiseaseOutbreak([]);
    } finally {
      setLoadingDiseaseOutbreak(false);
    }
  };

  // Fetch vaccine details on click and open modal
  const handleVaccineClick = async (vaccine) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:8000/vaccine-details?vaccine_name=${encodeURIComponent(vaccine.vaccine_name)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch vaccine details");
      const data = await res.json();

      setSelectedVaccine({
        ...data,
        due_date: vaccine.due_date,
        schedule_id: vaccine.schedule_id,
        child_id: vaccine.child_id,
        appointment_booked: vaccine.appointment_booked,  // ← Add this
      });
      setShowVaccineModal(true);
      setShowScheduleSection(false);
      setSelectedProviderId(null);
    } catch (err) {
      alert(err.message);
    }
  };

  // Fetch nearby providers inside vaccine modal for scheduling
  const fetchNearbyProvidersForSchedule = async (vaccineDueDate) => {
    const token = localStorage.getItem("token");
    setNearbyProvidersForSchedule([]);
    setShowScheduleSection(true);
    setAppointmentDate(vaccineDueDate);

    try {
      const res = await fetch("http://localhost:8000/child/nearby-providers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch providers");
      const data = await res.json();
      setNearbyProvidersForSchedule(data);
    } catch (err) {
      alert(err.message);
      setNearbyProvidersForSchedule([]);
    }
  };

  // Submit appointment to backend
  const submitAppointment = async () => {
    if (!selectedProviderId || !appointmentDate || !selectedVaccine) {
      alert("Please select a provider and appointment date.");
      return;
    }

    

    setScheduleSubmitting(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:8000/appointments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          child_id: selectedVaccine.child_id,
          appointment_date: appointmentDate,
          provider_id: selectedProviderId,
          schedule_id: selectedVaccine.schedule_id,
        }),
      });
      console.log("Submitting appointment:", {
        child_id: selectedVaccine.child_id,
        appointment_date: appointmentDate,
        provider_id: selectedProviderId,
        schedule_id: selectedVaccine.schedule_id,
      });
      if (
        !selectedVaccine?.child_id ||
        !appointmentDate ||
        !selectedProviderId ||
        !selectedVaccine?.schedule_id
      ) {
        alert("Please select a provider and appointment date.");
        return;
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to schedule appointment");
      }

      alert("Appointment scheduled successfully!");
      setShowScheduleSection(false);
      setShowVaccineModal(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setScheduleSubmitting(false);
    }
  };

  const navigateToChatBot = () => {
    navigate("/care");
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    fetchDiseaseOutbreak();
  }, []);

  if (loading) {
    return (
      <div className="text-center mt-10 text-lg text-gray-700">Loading data...</div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 font-sans max-w-screen-xl mx-auto">
      {/* Header */}
      <header className="bg-blue-600 shadow-md sticky top-0 z-10 rounded-lg mb-6">
        <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center justify-between border-b border-blue-700 rounded-lg">
          <h1 className="text-3xl font-bold text-white">
            Mother & Child Care Dashboard
          </h1>
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
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Upcoming Vaccinations (Next 30 Days)
        </h2>
        {upcomingVaccines.length === 0 ? (
          <p className="text-gray-600">No upcoming vaccinations scheduled.</p>
        ) : (
          <ul className="space-y-3">
  {upcomingVaccines.map((vaccine, idx) => (
    <li
      key={idx}
      onClick={() => handleVaccineClick(vaccine)}
      className="p-3 border rounded-md bg-blue-50 flex justify-between items-center cursor-pointer hover:bg-blue-100"
    >
      <div>
        <p className="font-medium text-gray-900">{vaccine.vaccine_name}</p>
        <p className="text-sm text-gray-700">Dose: {vaccine.dose_number}</p>
        {vaccine.appointment_booked && (
          <p className="text-sm text-green-600 font-semibold">Appointment Booked</p>
        )}
      </div>
      <span className="text-sm text-blue-700 font-semibold">
        Due on {new Date(vaccine.due_date).toLocaleDateString()}
      </span>
    </li>
  ))}
</ul>

        )}
      </section>

      {/* Buttons for Immunization History and Nearby Providers */}
      <div className="flex space-x-4 my-4">
        <button
          onClick={fetchImmunizationSummary}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
        >
          Show Immunization History
        </button>
        <button
          onClick={fetchNearbyProviders}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Show Nearby Providers
        </button>
      </div>

      {/* Disease Outbreak Section */}
      <section className="mb-12 bg-white rounded-xl shadow-lg p-8 border border-gray-300">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">
          Disease Outbreaks in the Last 30 Days
        </h2>
        {loadingDiseaseOutbreak ? (
          <p className="mt-4 text-gray-500 text-lg">Loading outbreaks...</p>
        ) : diseaseOutbreak.length > 0 ? (
          <ul className="space-y-5 mt-4">
            {diseaseOutbreak.map(({ disease, count }, idx) => (
              <li
                key={idx}
                className="p-6 border rounded-xl bg-indigo-50 shadow-md hover:shadow-lg transition"
              >
                <h3 className="text-3xl font-bold text-red-500">{disease}</h3>
                <p className="text-lg text-gray-700 mt-2">
                  Cases: <span className="font-semibold">{count}</span>
                </p>
                <p className="text-sm text-gray-600 mt-3">
                  Side Effects: Common side effects include fever, headaches, fatigue,
                  and muscle pain.
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-gray-500 text-lg">No significant outbreaks found.</p>
        )}
      </section>

      {/* Summaries Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {summaries.map((entry) => (
          <div
            key={entry.call_id}
            className="bg-white text-gray-800 rounded-xl shadow-md p-5 border border-gray-200 hover:shadow-lg flex flex-col"
          >
            <div className="flex justify-between text-sm text-gray-600 font-medium border-b pb-2 mb-4">
              <p>{new Date(entry.startedAt).toLocaleDateString()}</p>
              <p>
                {new Date(entry.startedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
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
                  <li
                    key={provider.provider_id}
                    className="border-b pb-3 last:border-none"
                  >
                    <p className="font-semibold">{provider.provider_name}</p>
                    <p className="text-sm">{provider.specialty || "General"}</p>
                    <p className="text-sm">{provider.address || "Address not available"}</p>
                    <p className="text-sm">{provider.pincode}</p>
                    <p className="text-sm">{provider.phone || "Phone not available"}</p>
                    <p className="text-sm">{provider.email || "Email not available"}</p>
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
                  <strong>Child:</strong> {immunizationSummary.first_name}{" "}
                  {immunizationSummary.last_name}
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

      {/* Vaccine Description & Benefits Modal */}
      {showVaccineModal && selectedVaccine && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex justify-center items-center p-4 z-50"
          onClick={() => setShowVaccineModal(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-lg w-full shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4">
              {selectedVaccine.vaccine_name} Vaccine Details
            </h3>
            <p className="mb-4">
              <strong>Description:</strong>{" "}
              {selectedVaccine.description || "No description available."}
            </p>
            <p>
              <strong>Benefits:</strong>{" "}
              {selectedVaccine.benefits || "No benefits information available."}
            </p>

            {!showScheduleSection ? (
  selectedVaccine.appointment_booked ? (
    <p className="mt-6 text-green-700 font-semibold">Appointment already booked</p>
  ) : (
    <button
      onClick={() =>
        fetchNearbyProvidersForSchedule(selectedVaccine.due_date)
      }
      className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
    >
      Schedule Appointment
    </button>
  )
) :(
              <>
                <h4 className="mt-6 font-semibold">Select Provider and Date</h4>
                <label className="block mt-2">
                  Appointment Date:
                  <input
                    type="date"
                    value={appointmentDate ? appointmentDate.slice(0, 10) : ""}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="border rounded p-1 ml-2"
                    min={selectedVaccine.due_date.slice(0, 10)}
                  />
                </label>

                <label className="block mt-4">
                  Provider:
                  <select
                    value={selectedProviderId || ""}
                    onChange={(e) => setSelectedProviderId(Number(e.target.value))}
                    className="border rounded p-1 ml-2"
                  >
                    <option value="" disabled>
                      Select a provider
                    </option>
                    {nearbyProvidersForSchedule.map((provider) => (
                      <option key={provider.provider_id} value={provider.provider_id}>
                        {provider.provider_name} ({provider.specialty || "General"})
                      </option>
                    ))}
                  </select>
                </label>

                <div className="mt-6 flex justify-end space-x-4">
                  <button
                    onClick={() => setShowScheduleSection(false)}
                    className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitAppointment}
                    disabled={scheduleSubmitting}
                    className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {scheduleSubmitting ? "Scheduling..." : "Confirm Appointment"}
                  </button>
                </div>
              </>
            )}

            <button
              onClick={() => setShowVaccineModal(false)}
              className="mt-4 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Floating Ask Assistant Button */}
      <button
        onClick={() => navigate("/ask")}
        className="fixed bottom-6 right-6 bg-purple-600 text-white rounded-full p-4 shadow-lg hover:bg-purple-700 transition z-50"
        title="Ask the Assistant"
      >
        💬 Ask Assistant
      </button>
    </main>
  );
}
