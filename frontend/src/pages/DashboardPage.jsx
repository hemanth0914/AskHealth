import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Spinner from './Spinner';
import VaccinationSummary from '../components/VaccinationSummary';

// Add image imports
import vaccineImage from '../assets/images/vaccine.jpg';
import doctorImage from '../assets/images/doctor.jpg';
import healthcareImage from '../assets/images/healthcare.jpg';
import childImage from '../assets/images/child.jpg';
import outbreakImage from '../assets/images/outbreak.jpg';

export default function DashboardPage({ onLogout }) {
  const [summaries, setSummaries] = useState([]);
  const [minimizedSummaries, setMinimizedSummaries] = useState(new Set());
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

  // Add new state for tab navigation
  const [activeTab, setActiveTab] = useState('dashboard');

  const [isCareHistoryMinimized, setIsCareHistoryMinimized] = useState(false);

  // Add state for health alerts
  const [healthAlerts, setHealthAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  const navigate = useNavigate();
  const diseaseOutbreakRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userEmail = localStorage.getItem("userEmail");

    if (!token || !userEmail) {
      setTimeout(() => navigate("/login", { replace: true }), 0);
      return;
    }

    async function fetchData() {
      try {
        const [summariesRes, vaccinesRes, providersRes] = await Promise.all([
          fetch("http://localhost:8000/summaries/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:8000/upcoming-vaccines", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:8000/child/nearby-providers", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!summariesRes.ok) throw new Error("Failed to fetch summaries");
        if (!vaccinesRes.ok) throw new Error("Failed to fetch upcoming vaccines");
        if (!providersRes.ok) throw new Error("Failed to fetch nearby providers");

        const summariesData = await summariesRes.json();
        const vaccinesData = await vaccinesRes.json();
        const providersData = await providersRes.json();

        setSummaries(summariesData);
        setUpcomingVaccines(vaccinesData);
        setNearbyProviders(providersData);
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

  
  useEffect(() => {
    const loadOutbreaks = async () => {
      if (localStorage.getItem("token")) {
        try {
          await fetchDiseaseOutbreak();
        } catch (err) {
          console.error("Error:", err);
        }
      }
    };
    loadOutbreaks();
  }, []);  

  const toggleMinimize = (callId) => {
    setMinimizedSummaries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(callId)) {
        newSet.delete(callId);
      } else {
        newSet.add(callId);
      }
      return newSet;
    });
  };

  // Add this function to fetch health alerts
  const fetchHealthAlerts = async () => {
    const token = localStorage.getItem("token");
    setLoadingAlerts(true);
    try {
      const res = await fetch("http://localhost:8000/health-alerts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch health alerts");
      const data = await res.json();
      setHealthAlerts(data.alerts);
    } catch (err) {
      console.error("Error fetching health alerts:", err);
    } finally {
      setLoadingAlerts(false);
    }
  };

  // Add to useEffect
  useEffect(() => {
    fetchHealthAlerts();
  }, []);

  if (loading) {
    return <Spinner />;
  }

  return (
    <main className="min-h-screen bg-[#f5f5f7] font-sans antialiased">
      {/* Apple-style gradient header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-[980px] mx-auto px-6">
          <div className="flex justify-between items-center h-[48px]">
            <h1 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              HealthCare Connect
            </h1>
            <nav className="hidden md:flex space-x-8">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`text-sm font-medium transition-colors duration-300 ${
                  activeTab === 'dashboard' 
                    ? 'text-blue-600' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => setActiveTab('vaccines')}
                className={`text-sm font-medium transition-colors duration-300 ${
                  activeTab === 'vaccines' 
                    ? 'text-blue-600' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Vaccinations
              </button>
              <button 
                onClick={() => {
                  setActiveTab('providers');
                  fetchNearbyProviders();
                }}
                className={`text-sm font-medium transition-colors duration-300 ${
                  activeTab === 'providers' 
                    ? 'text-blue-600' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Providers
              </button>
            </nav>
            <button
              onClick={onLogout}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-300"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[980px] mx-auto px-6 py-12">
        {/* Hero Section with Background Image */}
        <section className="relative text-center mb-16 rounded-3xl overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={healthcareImage}
              alt="Healthcare Background"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-gray-700/60 to-gray-900/60 mix-blend-multiply backdrop-blur-[2px]" />
          </div>
          <div className="relative py-20 px-6">
            <h2 className="text-5xl font-semibold text-white mb-4">
              Your Health Journey
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Stay on top of your vaccinations and connect with healthcare providers seamlessly.
            </p>
          </div>
        </section>

        {/* Stats Grid with Images */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            {
              title: 'Upcoming Vaccinations',
              count: upcomingVaccines.length,
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              ),
              color: 'blue',
              onClick: null,
              image: vaccineImage
            },
            {
              title: 'Nearby Providers',
              count: nearbyProviders.length,
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ),
              color: 'green',
              onClick: () => setShowProvidersModal(true),
              image: doctorImage
            },
            {
              title: 'Active Outbreaks',
              count: diseaseOutbreak.length,
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ),
              color: 'red',
              onClick: () => {
                diseaseOutbreakRef.current?.scrollIntoView({ 
                  behavior: 'smooth',
                  block: 'start'
                });
              },
              image: childImage
            }
          ].map((stat, idx) => (
            <div 
              key={idx}
              onClick={stat.onClick}
              className={`relative group bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-200/50 hover:shadow-md transition-all duration-300 ${stat.onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
            >
              <div className="absolute inset-0">
                <img
                  src={stat.image}
                  alt={stat.title}
                  className="w-full h-full object-cover opacity-20 group-hover:opacity-25 transition-opacity duration-300"
                />
              </div>
              <div className="relative p-6">
                <div className={`w-12 h-12 rounded-full bg-${stat.color}-100 flex items-center justify-center mb-4`}>
                  <div className={`text-${stat.color}-600`}>{stat.icon}</div>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">{stat.count}</h3>
                <p className="text-sm text-gray-500 mt-1">{stat.title}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Upcoming Vaccinations Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Upcoming Vaccinations</h2>
            <button
              onClick={fetchImmunizationSummary}
              className="group relative inline-flex items-center px-6 py-3 rounded-xl bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-gray-700/90 to-gray-900/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <svg 
                className="relative w-5 h-5 mr-2 text-gray-700 group-hover:text-white transition-colors duration-300" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                />
              </svg>
              <span className="relative font-medium text-gray-900 group-hover:text-white transition-colors duration-300">
                View History
              </span>
            </button>
          </div>
          
          {upcomingVaccines.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-200/50">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">No Upcoming Vaccinations</h3>
              <p className="text-gray-500 mt-2">You're all caught up with your vaccination schedule.</p>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden">
              <ul className="divide-y divide-gray-200/50">
                {upcomingVaccines.map((vaccine, idx) => (
                  <li
                    key={idx}
                    onClick={() => handleVaccineClick(vaccine)}
                    className="p-6 hover:bg-gray-50/50 cursor-pointer transition-colors duration-300"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {vaccine.vaccine_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Dose {vaccine.dose_number}
                        </p>
                      </div>
                      <div className="flex items-center">
                        {vaccine.appointment_booked ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            Booked
                          </span>
                        ) : (
                          <span className="text-sm text-blue-600">
                            Due {new Date(vaccine.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Disease Outbreaks Section */}
        <section ref={diseaseOutbreakRef} className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Disease Outbreaks</h2>
          {loadingDiseaseOutbreak ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : diseaseOutbreak.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-200/50">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">No Active Outbreaks</h3>
              <p className="text-gray-500 mt-2">Your area is currently safe from disease outbreaks.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {diseaseOutbreak.map(({ disease, count }, idx) => (
                <div
                  key={idx}
                  className="group relative bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.01]"
                >
                  <div className="absolute inset-0">
                    <img
                      src={outbreakImage}
                      alt="Disease Outbreak Background"
                      className="w-full h-full object-cover opacity-10 group-hover:opacity-20 transition-opacity duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-orange-50 opacity-50 group-hover:opacity-70 transition-opacity duration-300 mix-blend-multiply" />
                  </div>
                  <div className="relative p-10">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-6">
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-2xl font-semibold text-gray-900">{disease}</h3>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-4 py-2 rounded-full text-base font-medium bg-red-100 text-red-800">
                        {count} {count === 1 ? 'case' : 'cases'}
                      </span>
                    </div>
                    <div className="mt-6 pt-6 border-t border-gray-200/50">
                      <div className="flex items-center justify-between">
                        <span className="text-base text-gray-500">Current Status</span>
                        <span className={`text-base font-medium ${
                          count > 10 ? 'text-red-600' : count > 5 ? 'text-orange-600' : 'text-yellow-600'
                        }`}>
                          {count > 10 ? 'High Alert' : count > 5 ? 'Moderate' : 'Low Risk'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Health Alerts Section */}
        {healthAlerts.length > 0 && (
          <section className="mb-8">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-red-200/50 p-6">
              <h2 className="text-xl font-semibold text-red-600 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Health Alerts
              </h2>
              <div className="space-y-4">
                {healthAlerts.map((alert, index) => (
                  <div key={index} className="bg-red-50 rounded-xl p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="ml-3 flex-1">
                        <h3 className="text-lg font-medium text-red-800">
                          Potential {alert.disease} Detected
                        </h3>
                        <div className="mt-2 text-red-700">
                          <p className="text-sm">
                            Confidence: {alert.confidence}%
                          </p>
                          {alert.matching_symptoms && alert.matching_symptoms.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-medium mb-1">Matching symptoms:</p>
                              <ul className="list-disc list-inside text-sm space-y-1">
                                {alert.matching_symptoms.map((symptom, idx) => (
                                  <li key={idx} className="ml-2">
                                    {symptom.name}
                                    {symptom.severity && ` (${symptom.severity})`}
                                    {symptom.duration && ` - Duration: ${symptom.duration}`}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <p className="text-sm mt-2 font-medium">
                            {alert.recommendation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Care History Section */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Care History</h2>
            <button
              onClick={() => setIsCareHistoryMinimized(prev => !prev)}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              aria-label={isCareHistoryMinimized ? "Expand" : "Minimize"}
            >
              <svg 
                className={`h-5 w-5 transform transition-transform duration-200 ${
                  isCareHistoryMinimized ? 'rotate-180' : ''
                }`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          <div className={`grid grid-cols-1 gap-6 transition-all duration-300 ${
            isCareHistoryMinimized ? 'h-0 overflow-hidden' : ''
          }`}>
            {summaries
              .filter(entry => (entry.summary && entry.summary.trim() !== '') || entry.recordingUrl)
              .map((entry) => (
                <div
                  key={entry.call_id}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex flex-col space-y-4">
                    {/* Header with Date and Time */}
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-500">
                        {new Date(entry.startedAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-400">
                        {new Date(entry.startedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    {/* Audio Players */}
                    {entry.recordingUrl && (
                      <div className="space-y-3">
                        <div className="w-full">
                          <audio 
                            className="w-full" 
                            controls
                            src={entry.recordingUrl}
                          >
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    {entry.summary && entry.summary.trim() !== '' && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Call Summary</h3>
                        <p className="text-gray-700 text-sm whitespace-pre-wrap">
                          {entry.summary}
                        </p>
                      </div>
                    )}

                    {/* Duration */}
                    {entry.startedAt && entry.endedAt && (
                      <div className="flex items-center text-sm text-gray-500">
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Duration: {Math.round((new Date(entry.endedAt) - new Date(entry.startedAt)) / 1000 / 60)} minutes
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </section>

        {/* Floating Action Buttons */}
        <div className="fixed bottom-8 right-8 flex flex-col space-y-4">
          {/* Call Button */}
          <div className="relative group">
            <button
              onClick={() => navigate('/care')}
              className="group relative bg-white/80 backdrop-blur-xl p-4 rounded-2xl shadow-lg border border-gray-200/50 hover:scale-110 transition-all duration-300 hover:shadow-xl"
              aria-label="Call Assistant"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center justify-center">
                <svg className="h-6 w-6 text-gray-700 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
            </button>
            {/* Tooltip */}
            <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <div className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                Call Assistant
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 transform rotate-45 w-2 h-2 bg-gray-900"></div>
              </div>
            </div>
          </div>

          {/* Chat Button */}
          <div className="relative group">
            <button
              onClick={() => navigate('/ask')}
              className="group relative bg-white/80 backdrop-blur-xl p-4 rounded-2xl shadow-lg border border-gray-200/50 hover:scale-110 transition-all duration-300 hover:shadow-xl"
              aria-label="Chat Help"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center justify-center">
                <svg className="h-6 w-6 text-gray-700 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </button>
            {/* Tooltip */}
            <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <div className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                Chat Help
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 transform rotate-45 w-2 h-2 bg-gray-900"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Nearby Providers Modal */}
        {showProvidersModal && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
            onClick={() => setShowProvidersModal(false)}
          >
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 backdrop-blur-sm bg-gray-500/30 transition-all duration-300" 
                aria-hidden="true"
              />
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div 
                className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all duration-300 sm:my-8 sm:align-middle sm:max-w-lg sm:w-full animate-slide-up"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                        Nearby Healthcare Providers
                      </h3>
                      <div className="mt-4">
                        {loadingProviders ? (
                          <div className="flex justify-center py-8">
                            <Spinner />
                          </div>
                        ) : nearbyProviders.length === 0 ? (
                          <div className="text-center py-8">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No providers found</h3>
                            <p className="mt-1 text-sm text-gray-500">Try searching in a different area.</p>
                          </div>
                        ) : (
                          <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                            {nearbyProviders.map((provider) => (
                              <li key={provider.provider_id} className="py-4 hover:bg-gray-50 transition-colors duration-150">
                                <div className="flex items-center space-x-4">
                                  <div className="flex-shrink-0">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">{provider.provider_name}</p>
                                    <p className="text-sm text-gray-500">{provider.specialty || "General Practice"}</p>
                                    <p className="text-sm text-gray-500">{provider.address || "Address not available"}</p>
                                    <div className="mt-1 flex items-center space-x-2">
                                      {provider.phone && (
                                        <span className="inline-flex items-center text-sm text-gray-500">
                                          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                          </svg>
                                          {provider.phone}
                                        </span>
                                      )}
                                      {provider.email && (
                                        <span className="inline-flex items-center text-sm text-gray-500">
                                          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                          </svg>
                                          {provider.email}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200"
                    onClick={() => setShowProvidersModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Immunization Summary Modal */}
        {showImmunizationModal && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
            onClick={() => setShowImmunizationModal(false)}
          >
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 backdrop-blur-sm bg-gray-500/30 transition-all duration-300" 
                aria-hidden="true"
              />
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div 
                className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all duration-300 sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full animate-slide-up"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  {loadingSummary ? (
                    <div className="flex justify-center py-8">
                      <Spinner />
                    </div>
                  ) : immunizationSummary ? (
                    <VaccinationSummary
                      patientName={`${immunizationSummary.first_name} ${immunizationSummary.last_name}`}
                      summary={immunizationSummary.summary}
                      completed_count={immunizationSummary.completed_count}
                      upcoming_count={immunizationSummary.upcoming_count}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500">Unable to load summary</p>
                    </div>
                  )}
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-base font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm transition-all duration-200"
                    onClick={() => setShowImmunizationModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vaccine Description & Benefits Modal */}
        {showVaccineModal && selectedVaccine && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
            onClick={() => setShowVaccineModal(false)}
          >
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 backdrop-blur-sm bg-gray-500/30 transition-all duration-300" 
                aria-hidden="true"
              />
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div 
                className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all duration-300 sm:my-8 sm:align-middle sm:max-w-lg sm:w-full animate-slide-up"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="absolute top-0 right-0 pt-4 pr-4">
                  <button
                    type="button"
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => setShowVaccineModal(false)}
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {selectedVaccine.vaccine_name} Details
                      </h3>
                      <div className="mt-6 space-y-6">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-blue-800">Description</h4>
                          <p className="mt-2 text-sm text-blue-700">
                            {selectedVaccine.description || "No description available."}
                          </p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-green-800">Benefits</h4>
                          <p className="mt-2 text-sm text-green-700">
                            {selectedVaccine.benefits || "No benefits information available."}
                          </p>
                        </div>

                        {!showScheduleSection ? (
                          selectedVaccine.appointment_booked ? (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <div className="flex items-center">
                                <div className="flex-shrink-0">
                                  <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <div className="ml-3">
                                  <h3 className="text-sm font-medium text-green-800">
                                    Appointment Confirmed
                                  </h3>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => fetchNearbyProvidersForSchedule(selectedVaccine.due_date)}
                              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                            >
                              <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Schedule Appointment
                            </button>
                          )
                        ) : (
                          <div className="space-y-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h4 className="text-sm font-medium text-gray-900">Schedule Appointment</h4>
                              <div className="mt-4 space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">
                                    Appointment Date
                                  </label>
                                  <input
                                    type="date"
                                    value={appointmentDate ? appointmentDate.slice(0, 10) : ""}
                                    onChange={(e) => setAppointmentDate(e.target.value)}
                                    min={selectedVaccine.due_date.slice(0, 10)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">
                                    Select Provider
                                  </label>
                                  <select
                                    value={selectedProviderId || ""}
                                    onChange={(e) => setSelectedProviderId(Number(e.target.value))}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                  >
                                    <option value="" disabled>Choose a provider</option>
                                    {nearbyProvidersForSchedule.map((provider) => (
                                      <option key={provider.provider_id} value={provider.provider_id}>
                                        {provider.provider_name} ({provider.specialty || "General"})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-end space-x-3">
                              <button
                                type="button"
                                onClick={() => setShowScheduleSection(false)}
                                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={submitAppointment}
                                disabled={scheduleSubmitting}
                                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                              >
                                {scheduleSubmitting ? (
                                  <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Scheduling...
                                  </>
                                ) : (
                                  'Confirm Appointment'
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add smooth scrolling and transitions */}
      <style jsx>{`
        html {
          scroll-behavior: smooth;
        }
        
        @keyframes slide-up {
          from {
            transform: translate3d(0, 20px, 0);
            opacity: 0;
          }
          to {
            transform: translate3d(0, 0, 0);
            opacity: 1;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            backdrop-filter: blur(0);
          }
          to {
            opacity: 1;
            backdrop-filter: blur(4px);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </main>
  );
}
