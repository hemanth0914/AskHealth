import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';
import outbreakImage from '../assets/images/outbreak.jpg';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function HealthcareProviderDashboard({ onLogout }) {
  const [providerInfo, setProviderInfo] = useState(null);
  const [healthAlerts, setHealthAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [overdueVaccinations, setOverdueVaccinations] = useState([]);
  const [timeRange, setTimeRange] = useState('week');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const [voiceResponse, setVoiceResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [diseaseOutbreak, setDiseaseOutbreak] = useState([]);
  const [diseaseOutbreakLoading, setDiseaseOutbreakLoading] = useState(true);
  const [diseaseOutbreakError, setDiseaseOutbreakError] = useState(null);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const speechSynthesisRef = useRef(window.speechSynthesis);
  const navigate = useNavigate();
  const [isBackendConnected, setIsBackendConnected] = useState(true);

  // Voice assistant states
  const [agentResponse, setAgentResponse] = useState('');
  const [audioResponse, setAudioResponse] = useState(null);

  const timeRangeLabels = {
    today: "Today's Appointments",
    week: "Next 7 Days",
    month: "Next 30 Days",
    two_months: "Next 60 Days"
  };

  useEffect(() => {
    const fetchProviderData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Fetch provider profile
        const profileRes = await fetch('http://localhost:8000/provider/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!profileRes.ok) {
          throw new Error('Failed to fetch provider profile');
        }

        const profileData = await profileRes.json();
        console.log('Provider profile data:', profileData);
        setProviderInfo(profileData);

        // Fetch local health alerts
        const alertsRes = await fetch('http://localhost:8000/provider/local-health-alerts', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (alertsRes.ok) {
          const alertsData = await alertsRes.json();
          setHealthAlerts(alertsData.alerts);
        }

      } catch (error) {
        console.error('Error fetching provider data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProviderData();
    
    // Set up periodic refresh of health alerts
    const alertsInterval = setInterval(async () => {
      try {
        const token = localStorage.getItem('token');
        const alertsRes = await fetch('http://localhost:8000/provider/local-health-alerts', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (alertsRes.ok) {
          const alertsData = await alertsRes.json();
          setHealthAlerts(alertsData.alerts);
        }
      } catch (error) {
        console.error('Error refreshing health alerts:', error);
      }
    }, 300000); // Refresh every 5 minutes

    return () => clearInterval(alertsInterval);
  }, [navigate]);

  const fetchAppointments = async (range) => {
    setIsLoading(true);
    setTimeRange(range);
    try {
      const response = await fetch(`http://localhost:8000/provider/appointments?time_range=${range}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }
      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments('week');
  }, []);

  const formatAppointmentDate = (dateString) => {
    // Parse the UTC date string
    const date = new Date(dateString);
    
    // Format in local timezone
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const groupAppointmentsByDate = (appointments) => {
    return appointments.reduce((groups, appointment) => {
      // Parse the UTC date
      const date = new Date(appointment.appointment_date);
      // Get local date string for grouping
      const dateStr = date.toLocaleDateString('en-US');
      
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push({
        ...appointment,
        localTime: formatAppointmentDate(appointment.appointment_date)
      });
      return groups;
    }, {});
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Convert to local dates for comparison
    const localDate = new Date(date.toLocaleDateString('en-US'));
    const localToday = new Date(today.toLocaleDateString('en-US'));
    const localTomorrow = new Date(tomorrow.toLocaleDateString('en-US'));

    if (localDate.getTime() === localToday.getTime()) {
      return 'Today';
    }
    if (localDate.getTime() === localTomorrow.getTime()) {
      return 'Tomorrow';
    }
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // Update the Stats Grid section to properly count today's appointments
  const getTodayAppointments = (appointments) => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter(apt => 
      new Date(apt.appointment_date).toISOString().split('T')[0] === today
    ).length;
  };

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setTranscript(transcript);
        handleAgentQuery(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Handle starting/stopping voice input
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript('');
      setAgentResponse('');
      setAudioResponse(null);
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Handle agent query
  const handleAgentQuery = async (query) => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/agent/query/provider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        throw new Error('Failed to get agent response');
      }

      const data = await response.json();
      setAgentResponse(data.text_response);
      
      // If there's an audio response, convert base64 to audio
      if (data.audio_response) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audio_response}`);
        setAudioResponse(audio);
        audio.play();
      }
    } catch (err) {
      console.error('Error querying agent:', err);
      setError('Failed to process your request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Update connection check function to use provider profile endpoint
  const checkBackendConnection = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/provider/profile', {
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      const isConnected = response.ok;
      setIsBackendConnected(isConnected);
      return isConnected;
    } catch (err) {
      console.error('Backend connection check failed:', err);
      setIsBackendConnected(false);
      return false;
    }
  };

  // Update check interval to be less frequent (every minute instead of 30 seconds)
  useEffect(() => {
    const checkConnection = () => {
      checkBackendConnection();
    };

    // Check connection immediately
    checkConnection();

    // Then check every minute
    const intervalId = setInterval(checkConnection, 60000);

    return () => clearInterval(intervalId);
  }, []);

  // Update the test connection button implementation
  const testBackendConnection = async () => {
    try {
      console.log('Testing backend connection...');
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/agent/query/provider', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: "Test query",
          return_audio: true  // Request audio response
        })
      });

      if (!response.ok) {
        throw new Error('Failed to connect to backend');
      }

      const data = await response.json();
      console.log('Test connection successful:', data);
      setVoiceResponse('Connection test successful: ' + data.text_response);
      setIsBackendConnected(true);

      // Test audio response
      if (data.audio_response) {
        console.log('Playing test audio response');
        stopAllAudio();
        
        audioRef.current = new Audio(`data:audio/mp3;base64,${data.audio_response}`);
        await audioRef.current.play();
      } else {
        speakResponse(data.text_response);
      }
    } catch (err) {
      console.error('Test connection failed:', err);
      setError('Connection test failed: ' + err.message);
      setIsBackendConnected(false);
    }
  };

  const speakResponse = (text) => {
    // Cancel any ongoing speech first
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    
    utterance.onstart = () => {
      console.log('Started speaking response');
    };
    
    utterance.onend = () => {
      console.log('Finished speaking response');
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
    };
    
    speechSynthesisRef.current.speak(utterance);
  };

  const stopAllAudio = () => {
    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    // Stop any ongoing speech synthesis
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
    }
  };

  // Clean up audio on component unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  useEffect(() => {
    const fetchOverdueVaccinations = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8000/provider/overdue-vaccinations', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch overdue vaccinations');
        }

        const data = await response.json();
        console.log('Overdue vaccinations data:', data); // Debug log
        setOverdueVaccinations(data);
      } catch (error) {
        console.error('Error fetching overdue vaccinations:', error);
      }
    };

    fetchOverdueVaccinations();
  }, []);

  // Add function to fetch health alerts
  const fetchHealthAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      const alertsRes = await fetch('http://localhost:8000/provider/local-health-alerts', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setHealthAlerts(alertsData.alerts);
      }
    } catch (error) {
      console.error('Error fetching health alerts:', error);
    }
  };

  // Add function to confirm disease diagnosis
  const confirmDisease = async (alert) => {
    try {
      const token = localStorage.getItem('token');
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      
      // Log the alert object to see its structure
      console.log('Original alert object:', alert);
      
      // Prepare the request payload
      const payload = {
        child_id: alert.child_id,
        disease: alert.disease,
        diagnosed_date: formattedDate,
        alert_id: alert.alert_id
      };
      console.log('Confirming disease with payload:', payload);

      const response = await fetch('http://localhost:8000/provider/confirm-disease', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      // Log the full response details
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      if (!response.ok) {
        let errorDetail;
        try {
          const errorData = JSON.parse(responseText);
          console.error('Parsed error response:', errorData);
          errorDetail = errorData.detail || 'Unknown error';
        } catch (e) {
          console.error('Failed to parse error response:', e);
          errorDetail = responseText || 'Failed to confirm disease';
        }
        throw new Error(errorDetail);
      }

      // Refresh health alerts after confirmation
      await fetchHealthAlerts();
      alert('Disease confirmed successfully');
    } catch (error) {
      console.error('Error confirming disease:', error);
      alert(`Failed to confirm disease: ${error.message}`);
    }
  };

  // Separate useEffect for disease outbreak data
  useEffect(() => {
    const fetchDiseaseOutbreak = async () => {
      setDiseaseOutbreakLoading(true);
      setDiseaseOutbreakError(null);
      try {
        const token = localStorage.getItem('token');
        const userType = localStorage.getItem('userType');

        if (!token) {
          throw new Error('No authentication token found');
        }

        if (userType !== 'provider') {
          throw new Error('Not authorized as a provider');
        }

        console.log('Fetching disease outbreak data...');
        const response = await fetch('http://localhost:8000/provider/disease-outbreak', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Disease outbreak response not ok:', response.status, errorData);
          throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Disease outbreak data received:', data);
        
        if (!Array.isArray(data)) {
          console.error('Invalid response format:', data);
          throw new Error('Invalid response format from server');
        }

        setDiseaseOutbreak(data);
      } catch (error) {
        console.error('Error fetching disease outbreak data:', error);
        setDiseaseOutbreakError(error.message);
      } finally {
        setDiseaseOutbreakLoading(false);
      }
    };

    fetchDiseaseOutbreak();
  }, []); // Empty dependency array means this runs once on mount

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const VoiceAssistant = () => (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Voice Assistant</h2>
        <button
          onClick={toggleListening}
          disabled={isProcessing}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2
            ${isListening
              ? 'bg-red-600 text-white hover:bg-red-700'
              : isProcessing
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
        >
          {isListening ? (
            <>
              <FaMicrophoneSlash className="h-4 w-4" />
              <span>Stop Listening</span>
            </>
          ) : (
            <>
              <FaMicrophone className="h-4 w-4" />
              <span>Start Listening</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          <span>{error}</span>
        </div>
      )}

      {transcript && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-2">You said:</h3>
          <p className="text-gray-700 italic">{transcript}</p>
        </div>
      )}

      {agentResponse && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-medium text-gray-900 mb-2">Assistant Response:</h3>
          <p className="text-gray-700">{agentResponse}</p>
        </div>
      )}

      <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="font-medium text-gray-900 mb-3">You can ask questions about:</h3>
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          <li>Appointments and schedules</li>
          <li>Health alerts in your area</li>
          <li>Upcoming vaccinations</li>
        </ul>
      </div>
    </div>
  );

  // Disease Outbreak Section with improved error handling
  const DiseaseOutbreakSection = () => (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Disease Outbreaks</h2>
      {diseaseOutbreakLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : diseaseOutbreakError ? (
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">Error loading disease outbreak data</div>
          <div className="text-sm text-gray-500">{diseaseOutbreakError}</div>
        </div>
      ) : diseaseOutbreak.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
            <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-500">No active outbreaks in your area.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {diseaseOutbreak.map((outbreak, idx) => (
            <div
              key={idx}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{outbreak.disease}</h3>
                  <p className="text-gray-600 mt-1">
                    {outbreak.count} {outbreak.count === 1 ? 'case' : 'cases'} reported
                  </p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                  outbreak.count > 10 
                    ? 'bg-red-100 text-red-800' 
                    : outbreak.count > 5 
                    ? 'bg-orange-100 text-orange-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {outbreak.count > 10 ? 'High Alert' : outbreak.count > 5 ? 'Moderate' : 'Low Risk'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <main className="min-h-screen bg-[#f5f5f7] font-sans antialiased">
      {/* Apple-style gradient header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-[980px] mx-auto px-6">
          <div className="flex justify-between items-center h-[48px]">
            <h1 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Provider Dashboard
            </h1>
            <div className="flex items-center space-x-6">
              <button
                onClick={() => navigate('/provider/overdue-vaccinations')}
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors duration-300 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Overdue Vaccinations</span>
              </button>
              <button
                onClick={onLogout}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-300"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[980px] mx-auto px-6 py-12">
        {/* Hero Section */}
        <section className="relative text-center mb-16 rounded-3xl overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
              alt="Healthcare Background"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-gray-700/60 to-gray-900/60 mix-blend-multiply backdrop-blur-[2px]" />
          </div>
          <div className="relative py-20 px-6">
            <h2 className="text-5xl font-semibold text-white mb-4">
              Welcome, Dr. {providerInfo?.provider_name?.split(' ')[1]}
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Manage your practice and patient care efficiently
            </p>
          </div>
        </section>

        <VoiceAssistant />
        <DiseaseOutbreakSection />
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            {
              title: 'Today\'s Appointments',
              count: getTodayAppointments(appointments),
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ),
              color: 'blue'
            },
            {
              title: 'Health Alerts',
              count: healthAlerts.length,
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ),
              color: 'red'
            },
            {
              title: 'Overdue Vaccinations',
              count: overdueVaccinations.length,
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              color: 'yellow'
            }
          ].map((stat, idx) => (
            <div 
              key={idx}
              className="relative group bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-200/50 hover:shadow-md transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="p-6">
                <div className={`w-12 h-12 rounded-full bg-${stat.color}-100 flex items-center justify-center mb-4`}>
                  <div className={`text-${stat.color}-600`}>{stat.icon}</div>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">{stat.count}</h3>
                <p className="text-sm text-gray-500 mt-1">{stat.title}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Appointments Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">{timeRangeLabels[timeRange]}</h2>
            <div className="flex gap-2">
              <button
                onClick={() => fetchAppointments('today')}
                className={`px-4 py-2 rounded ${timeRange === 'today' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                Today
              </button>
              <button
                onClick={() => fetchAppointments('week')}
                className={`px-4 py-2 rounded ${timeRange === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                Next 7 Days
              </button>
              <button
                onClick={() => fetchAppointments('month')}
                className={`px-4 py-2 rounded ${timeRange === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                Next 30 Days
              </button>
              <button
                onClick={() => fetchAppointments('two_months')}
                className={`px-4 py-2 rounded ${timeRange === 'two_months' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                Next 60 Days
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No appointments scheduled for this time period
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupAppointmentsByDate(appointments)).map(([date, dayAppointments]) => (
                <div key={date} className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    {formatDate(date)}
                  </h3>
                  <div className="space-y-3">
                    {dayAppointments.map((appointment, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                        <div>
                          <p className="font-medium text-gray-800">
                            {timeRange === 'today' ? appointment.formatted_time : 
                             new Date(appointment.appointment_date).toLocaleTimeString('en-US', { 
                               hour: 'numeric', 
                               minute: '2-digit',
                               hour12: true 
                             })}
                            {' - '}{appointment.patient_name}
                          </p>
                          <p className="text-gray-600">
                            {appointment.vaccine_name}
                            {appointment.dose_number > 0 && ` (Dose ${appointment.dose_number})`}
                          </p>
                          {appointment.notes && (
                            <p className="text-sm text-gray-500 mt-1">
                              Notes: {appointment.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Health Alerts */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Local Health Alerts</h2>
          {healthAlerts.length > 0 ? (
            <div className="space-y-4">
              {healthAlerts.map((alert, index) => (
                <div key={index} className="border-l-4 border-red-400 bg-red-50 p-4">
                  <div className="flex flex-col">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-red-800">
                          {alert.disease}
                        </h3>
                        <p className="text-sm text-red-600">
                          Patient: {alert.patient_name}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => confirmDisease(alert)}
                          className="px-3 py-1.5 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors duration-200 flex items-center"
                        >
                          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Confirm Disease
                        </button>
                        <button 
                          onClick={() => window.open(`mailto:${alert.patient_email}?subject=Health Alert Follow-up: ${alert.disease}&body=Dear Parent,%0D%0A%0D%0AWe noticed some concerning health symptoms related to ${alert.disease}. I recommend scheduling a consultation to discuss these symptoms and ensure proper care.%0D%0A%0D%0ABest regards,%0D%0A${providerInfo?.provider_name}`)}
                          className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors duration-200"
                        >
                          Contact Parent
                        </button>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-red-700">
                        {alert.matching_symptoms && alert.matching_symptoms.length > 0 
                          ? alert.matching_symptoms
                              .filter(symptom => symptom && symptom.symptom_name)
                              .map(symptom => symptom.symptom_name)
                              .join(", ")
                          : "No symptoms recorded"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No health alerts at this time.</p>
            </div>
          )}
        </div>

        {/* Quick Actions - Remove the section if it's empty */}
        {false && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden transition-all duration-300 hover:shadow-md">
            <div className="p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Add any new quick actions here */}
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