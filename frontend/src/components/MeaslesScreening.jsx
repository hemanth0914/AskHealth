import React, { useState, useRef, useEffect } from 'react';
import { FaMicrophone, FaMicrophoneSlash, FaPlay } from 'react-icons/fa';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function MeaslesScreening() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [conversationStarted, setConversationStarted] = useState(false);
  
  const wsRef = useRef(null);
  const audioRef = useRef(null);
  const recognitionRef = useRef(null);
  const silenceTimeoutRef = useRef(null);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = async (event) => {
        if (silenceTimeoutRef.current) {
          clearInterval(silenceTimeoutRef.current);
        }

        try {
          const finalTranscript = event.results[0][0].transcript;
          if (!finalTranscript.trim()) return;
          
          console.log('Got transcript:', finalTranscript);
          setTranscript(finalTranscript);
          
          const token = localStorage.getItem('token');
          if (!token) {
            setError('No authentication token found. Please log in again.');
            return;
          }

          setIsProcessing(true);
          
          // Stop any existing audio playback
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
          }

          // Send the transcript through WebSocket
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'user_input',
              text: finalTranscript
            }));
          } else {
            setError('WebSocket connection lost. Please try again.');
            setConversationStarted(false);
          }

        } catch (err) {
          console.error('Error processing speech:', err);
          setError('Failed to process speech: ' + err.message);
        } finally {
          setIsProcessing(false);
        }
      };

      recognitionRef.current = recognition;
    } else {
      setError('Speech recognition is not supported in your browser.');
    }

    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (silenceTimeoutRef.current) {
        clearInterval(silenceTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const startConversation = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please log in again.');
        return;
      }

      setIsProcessing(true);
      setError(null);
      
      // Stop any existing audio playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Close existing WebSocket if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      // Connect to WebSocket
      wsRef.current = new WebSocket('ws://localhost:8000/screening/measles/ws');
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        // Send authentication
        wsRef.current.send(JSON.stringify({
          type: 'start',
          token
        }));
      };
      
      wsRef.current.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received WebSocket message:', data);
          
          if (data.type === 'response') {
            setResponse({
              text_response: data.text_response,
              audio_response: data.audio_response,
              is_complete: data.is_complete,
              should_listen: data.should_listen
            });
            
            // Play audio if available
            if (data.audio_response) {
              try {
                const audio = new Audio(`data:audio/mp3;base64,${data.audio_response}`);
                audioRef.current = audio;
                
                audio.onended = () => {
                  audioRef.current = null;
                  if (!data.is_complete && data.should_listen) {
                    setTimeout(() => {
                      startListening();
                    }, 500);
                  }
                };
                
                await audio.play();
              } catch (audioErr) {
                console.error('Error playing audio:', audioErr);
              }
            } else if (!data.is_complete && data.should_listen) {
              // If no audio but should listen, start listening after a short delay
              setTimeout(() => {
                startListening();
              }, 500);
            }
            
            if (data.is_complete) {
              if (wsRef.current) {
                wsRef.current.close();
              }
            }
          } else if (data.type === 'error') {
            setError(data.message);
            setConversationStarted(false);
          }
        } catch (err) {
          console.error('Error processing WebSocket message:', err);
          setError('Error processing response: ' + err.message);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error. Please try again.');
        setConversationStarted(false);
      };
      
      wsRef.current.onclose = (event) => {
        console.log('WebSocket closed:', event);
        if (!event.wasClean) {
          setError('Connection closed unexpectedly. Please try again.');
          setConversationStarted(false);
        }
      };
      
      setConversationStarted(true);
      
    } catch (err) {
      console.error('Error starting conversation:', err);
      setError('Failed to start conversation: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const startListening = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError('Connection lost. Please restart the conversation.');
      setConversationStarted(false);
      return;
    }
    
    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error('Failed to start listening:', err);
      setError('Failed to start listening. Please try again.');
    }
  };

  const stopScreening = async () => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (silenceTimeoutRef.current) {
        clearInterval(silenceTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      setIsListening(false);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please log in again.');
        return;
      }

      const response = await fetch('http://localhost:8000/screening/reset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      setTranscript('');
      setResponse(null);
      setConversationStarted(false);
      setError(null);
      
    } catch (err) {
      console.error('Error stopping screening:', err);
      setError('Failed to stop screening: ' + err.message);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Measles Screening Assistant</h2>
        <div className="flex items-center space-x-4">
          {isProcessing && (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
              <span className="text-sm text-blue-600">Processing...</span>
            </div>
          )}
          
          {isListening && (
            <div className="flex items-center">
              <div className="animate-pulse text-blue-500 mr-2">●</div>
              <span className="text-sm text-blue-600">Listening...</span>
            </div>
          )}
          
          {!conversationStarted ? (
            <button
              onClick={startConversation}
              disabled={isProcessing}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2
                ${isProcessing
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'}`}
            >
              <FaPlay className="h-4 w-4" />
              <span>Start Screening</span>
            </button>
          ) : (
            <button
              onClick={stopScreening}
              disabled={!isListening && !conversationStarted}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2
                ${isListening || conversationStarted
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-300 cursor-not-allowed'}`}
            >
              <FaMicrophoneSlash className="h-4 w-4" />
              <span>End Screening</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {transcript && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">You said:</h3>
          <p className="text-gray-700 italic">{transcript}</p>
        </div>
      )}

      {response && (
        <div className="mt-4 space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Screening Response:</h3>
            <div className="space-y-4">
              <div className="text-gray-700">
                {response.text_response}
              </div>

              <div className="flex items-center space-x-4 text-sm">
                {response.is_complete && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                    Screening Complete
                  </span>
                )}
                {response.should_listen && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    Follow-up Required
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!conversationStarted && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-3">Example Questions:</h3>
          <ul className="space-y-2 text-gray-600">
            <li>• "My child has a high fever and rash"</li>
            <li>• "Are red spots and cough symptoms of measles?"</li>
            <li>• "What are the early symptoms of measles?"</li>
            <li>• "Should I be concerned about my child's fever and runny nose?"</li>
          </ul>
        </div>
      )}
    </div>
  );
} 