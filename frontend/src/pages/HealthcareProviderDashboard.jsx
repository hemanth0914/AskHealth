import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMicrophone, FaMicrophoneSlash, FaUserPlus, FaSpinner, FaPhone } from 'react-icons/fa';
import { vapi, startAssistant, stopAssistant } from '../ai';
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

  const [pendingQuery, setPendingQuery] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // Add new VAPI-related states
  const [vapiStarted, setVapiStarted] = useState(false);
  const [vapiLoading, setVapiLoading] = useState(false);
  const [assistantIsSpeaking, setAssistantIsSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [callId, setCallId] = useState("");
  const [showThankYou, setShowThankYou] = useState(false);

  // Add new states for PDF upload
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, success, error
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

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
        setPendingQuery(transcript);
        setIsConfirming(true);
        setAgentResponse('Is this what you said? Please confirm.');
        speakResponse('Is this what you said? Please confirm.');
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

  // Add function to record vaccination
  const recordVaccination = async (childId, vaccineName, doseNumber) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/provider/record-vaccination', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          child_id: childId,
          vaccine_name: vaccineName,
          dose_number: doseNumber,
          administered_by: providerInfo?.provider_name || '',
          notes: `Recorded via voice assistant by ${providerInfo?.provider_name}`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to record vaccination');
      }

      return await response.json();
    } catch (error) {
      console.error('Error recording vaccination:', error);
      throw error;
    }
  };

  // Update handleAgentQuery to handle vaccination recording
  const handleAgentQuery = async (query) => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      
      // Send the query to the agent endpoint
      const response = await fetch('http://localhost:8000/agent/query/provider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          query,
          return_audio: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get agent response');
      }

      const data = await response.json();
      
      // Handle the response based on type
      if (data.type === 'ehr_request') {
        setAgentResponse(data.message);
        if (data.data?.ehr_generated) {
          speakResponse("I've generated and sent the EHR to your email.");
        } else {
          speakResponse(data.message);
        }
      } else {
        setAgentResponse(data.text_response || data.message);
        if (data.audio_response) {
          const audio = new Audio(`data:audio/mp3;base64,${data.audio_response}`);
          setAudioResponse(audio);
          audio.play();
        } else {
          speakResponse(data.text_response || data.message);
        }
      }
    } catch (err) {
      console.error('Error processing query:', err);
      const errorMessage = 'Failed to process your request. Please try again.';
      setError(errorMessage);
      speakResponse(errorMessage);
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

  const handleTranscriptConfirmation = async (isConfirmed) => {
    if (isConfirmed) {
        setIsProcessing(true);
        try {
            const token = localStorage.getItem('token');
            
            // Updated pattern to better handle variations and vaccine names
            const vaccinationPattern = /(?:child|kid|patient)(?:\s+with)?\s+(?:id\s+)?(\d+)\s+(?:has|have)\s+(?:taken|received|got)\s+(?:vaccine|vaccination)?\s*([\w\s-]+?)(?:\s+(?:vaccine|vaccination|booster|shot|dose))?\s*(?:dose\s+(\d+))?\s+today/i;
            const ehrPattern = /(?:fetch|get|send)\s+(?:ehr|electronic health record|health record|medical record|patient record)\s+(?:for\s+)?(?:child|kid|patient)\s+(?:with\s+)?(?:ssn\s+)?(\d{4}|\d{9})/i;
            
            const vacMatch = pendingQuery.match(vaccinationPattern);
            const ehrMatch = pendingQuery.match(ehrPattern);

            if (vacMatch) {
                // Handle vaccination record
                const childId = parseInt(vacMatch[1]);
                const vaccineName = vacMatch[2].trim().toUpperCase();
                const doseNumber = vacMatch[3] ? parseInt(vacMatch[3]) : 1;

                console.log('Processing vaccination record:', {
                    childId,
                    vaccineName,
                    doseNumber,
                    originalMatch: vacMatch[2]
                });

                const response = await fetch('http://localhost:8000/provider/record-vaccination', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        child_id: childId,
                        vaccine_name: vaccineName,
                        dose_number: doseNumber,
                        administered_by: providerInfo?.provider_name || '',
                        notes: `Recorded via voice assistant by ${providerInfo?.provider_name}`
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to record vaccination');
                }

                const successMessage = `Successfully recorded vaccination for patient ${childId}: ${vaccineName} dose ${doseNumber}`;
                setAgentResponse(successMessage);
                speakResponse(successMessage);
            } else if (ehrMatch) {
                // Handle EHR request
                const ssn = ehrMatch[1];
                console.log('Processing EHR request for SSN:', ssn);

                const response = await fetch(`http://localhost:8000/provider/generate-ehr?ssn=${ssn}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to generate EHR');
                }

                const data = await response.json();
                setAgentResponse(data.message);
                speakResponse(data.message);
            } else {
                // For non-vaccination queries, proceed with normal agent query
                const response = await fetch('http://localhost:8000/agent/query/provider', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ 
                        query: pendingQuery,
                        return_audio: true 
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to get agent response');
                }

                const data = await response.json();
                setAgentResponse(data.text_response);
                
                if (data.audio_response) {
                    const audio = new Audio(`data:audio/mp3;base64,${data.audio_response}`);
                    setAudioResponse(audio);
                    audio.play();
                } else {
                    speakResponse(data.text_response);
                }
            }
        } catch (err) {
            console.error('Error processing query:', err);
            const errorMessage = 'Failed to process your request. Please try again.';
            setError(errorMessage);
            speakResponse(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    } else {
        // Clear and ask for repeat
        setTranscript('');
        setAgentResponse('Please repeat your command.');
        speakResponse('Please repeat your command.');
    }
    // Reset confirmation state
    setIsConfirming(false);
    setPendingQuery(null);
};

  // Initialize VAPI
  useEffect(() => {
    vapi
      .on("call-start", () => {
        setVapiLoading(false);
        setVapiStarted(true);
      })
      .on("call-end", () => {
        setVapiStarted(false);
        setVapiLoading(false);
      })
      .on("speech-start", () => setAssistantIsSpeaking(true))
      .on("speech-end", () => setAssistantIsSpeaking(false))
      .on("volume-level", (level) => setVolumeLevel(level));
  }, []);

  // Handle VAPI initialization
  const initializeVapi = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You need to log in first.");
        return;
      }

      setVapiLoading(true);
      const response = await fetch("http://localhost:8000/provider/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const providerData = await response.json();
      const data = await startAssistant(providerData);
      
      if (data && (data.id || data.call?.id)) {
        const id = data.id || data.call.id;
        setCallId(id);
        console.log("✅ Assistant ready with call ID:", id);
      } else {
        throw new Error("Failed to get valid assistant ID");
      }
    } catch (error) {
      console.error("Failed to initialize VAPI:", error);
      setVapiLoading(false);
      alert("Failed to initialize voice assistant. Please try again.");
    }
  };

  // Handle stopping VAPI
  const handleVapiStop = async () => {
    try {
      stopAssistant();
      setVapiStarted(false);
      setShowThankYou(true);
      setTimeout(() => {
        setShowThankYou(false);
      }, 3000);
    } catch (error) {
      console.error("Error stopping VAPI:", error);
    }
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setUploadError(null);
    } else {
      setUploadError('Please select a PDF file');
      setSelectedFile(null);
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError('Please select a file first');
      return;
    }

    setUploadStatus('uploading');
    setUploadError(null);

    const formData = new FormData();
    formData.append('pdf_file', selectedFile);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/provider/upload-client-pdf', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload file');
      }

      const data = await response.json();
      
      if (data.status === 'exists') {
        setUploadStatus('warning');
        setUploadError(data.message);
      } else if (data.status === 'success') {
        setUploadStatus('success');
        setTimeout(() => {
          setShowUploadModal(false);
          setSelectedFile(null);
          setUploadStatus('idle');
        }, 2000);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.message);
      setUploadStatus('error');
    }
  };

  // Update the AddClientModal component
  const AddClientModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add New Client</h2>
          <button
            onClick={() => {
              setShowUploadModal(false);
              setSelectedFile(null);
              setUploadStatus('idle');
              setUploadError(null);
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              disabled={uploadStatus === 'uploading'}
            >
              Select PDF File
            </button>
            {selectedFile && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {selectedFile.name}
              </p>
            )}
          </div>

          {uploadError && (
            <div className={`text-sm ${
              uploadStatus === 'warning' ? 'text-orange-500' : 'text-red-500'
            }`}>
              {uploadError}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploadStatus === 'uploading'}
            className={`w-full py-2 px-4 rounded transition-colors ${
              uploadStatus === 'uploading'
                ? 'bg-gray-400'
                : uploadStatus === 'success'
                ? 'bg-green-500'
                : uploadStatus === 'warning'
                ? 'bg-orange-500'
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white flex items-center justify-center space-x-2`}
          >
            {uploadStatus === 'uploading' ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>Uploading...</span>
              </>
            ) : uploadStatus === 'success' ? (
              'Upload Successful!'
            ) : uploadStatus === 'warning' ? (
              'Client Already Exists'
            ) : (
              'Upload PDF'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const VoiceAssistant = () => (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Voice Commands</h2>
          <button
            onClick={toggleListening}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-200'
                : 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-200'
            } shadow-lg transform hover:scale-105`}
          >
            {isListening ? (
              <>
                <FaMicrophoneSlash className="w-4 h-4" />
                <span>Stop Recording</span>
              </>
            ) : (
              <>
                <FaMicrophone className="w-4 h-4" />
                <span>Ask your query</span>
              </>
            )}
          </button>
        </div>

        {transcript && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="font-medium text-gray-700">Your command:</p>
            <p className="text-gray-600 mt-1">{transcript}</p>
          </div>
        )}

        {agentResponse && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="font-medium text-blue-700">Assistant Response:</p>
            <p className="text-gray-700 mt-1">{agentResponse}</p>
            
            {/* Show confirmation buttons when there's a pending query */}
            {isConfirming && (
              <div className="mt-4 flex space-x-4">
                <button
                  onClick={() => handleTranscriptConfirmation(true)}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-green-200"
                >
                  Yes, That's Correct
                </button>
                <button
                  onClick={() => handleTranscriptConfirmation(false)}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-200"
                >
                  No, Let Me Repeat
                </button>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
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

  // Replace the VapiAssistant component with a floating button
  const VapiAssistant = () => (
    <div className="fixed bottom-8 right-8 z-50">
      <div className="relative group">
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 transition-opacity duration-200 opacity-0 group-hover:opacity-100">
          <div className="bg-gray-800 text-white text-sm py-1 px-3 rounded-md whitespace-nowrap">
            {vapiStarted ? 'End Call' : 'Call Assistant'}
          </div>
        </div>

        {/* Main Button */}
        <button
          onClick={vapiStarted ? handleVapiStop : initializeVapi}
          disabled={vapiLoading}
          className={`w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${
            vapiStarted
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white`}
        >
          {vapiLoading ? (
            <FaSpinner className="w-6 h-6 animate-spin" />
          ) : vapiStarted ? (
            <FaMicrophoneSlash className="w-6 h-6" />
          ) : (
            <FaPhone className="w-6 h-6" />
          )}
        </button>

        {/* Status Indicator */}
        {vapiStarted && (
          <div className="absolute -top-1 -right-1 w-4 h-4">
            <div className={`w-full h-full rounded-full ${
              assistantIsSpeaking ? 'bg-green-500' : 'bg-blue-500'
            } animate-pulse`}/>
          </div>
        )}
      </div>

      {/* Thank You Message */}
      {showThankYou && (
        <div className="absolute bottom-full right-0 mb-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-up">
          Thank you for using VAPI assistant!
        </div>
      )}
    </div>
  );

  // Add these styles at the end of your file
  const styles = `
    @keyframes fade-up {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-fade-up {
      animation: fade-up 0.3s ease-out forwards;
    }
  `;

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
                onClick={() => setShowUploadModal(true)}
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors duration-300 flex items-center space-x-2"
              >
                <FaUserPlus className="w-4 h-4" />
                <span>Add Client</span>
              </button>
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
              Welcome, HealthCare Provider
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

      {showUploadModal && <AddClientModal />}

      {/* Add VapiAssistant outside the main content area */}
      <VapiAssistant />
      
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
      <style jsx>{styles}</style>
    </main>
  );
} 