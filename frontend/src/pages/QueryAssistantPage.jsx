import React, { useState, useRef, useEffect } from 'react';

export default function QueryAssistantPage() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! Ask me anything related to your healthcare data. I will try to provide an answer.'
    }
  ]);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
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
        body: JSON.stringify({ messages: newMessages })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Failed to fetch response');
      }

      const data = await res.json();
      // data.response contains the assistant summary text
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-12">
      <h1 className="text-3xl font-bold mb-4 text-blue-700">Assistant Chat</h1>

      <div className="w-full max-w-2xl bg-white shadow rounded-lg p-4 mb-6 h-[60vh] overflow-y-auto border border-gray-200">
        {messages.map((msg, idx) => (
          <div key={idx} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block px-4 py-2 rounded-lg whitespace-pre-wrap ${
              msg.role === 'user' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
        {loading && (
          <div className="text-gray-500 text-sm text-left">Thinking...</div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-2xl flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question..."
          className="flex-1 border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
        >
          Send
        </button>
      </form>

      {error && <p className="text-red-600 mt-4">Error: {error}</p>}
    </div>
  );
}
