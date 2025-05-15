import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage'; // Home page with login
import DashboardPage from './pages/DashboardPage'; // The dashboard page for caregivers
import ChatBotPage from './pages/ChatbotPage'; // The page for interacting with the assistant
import Login from './pages/Login'; // The login page
import './index.css';
import Signup from './pages/Signup';

function App() {
  const [role, setRole] = useState('customer'); // Default role

  return (
    <Router>
      <Routes>
        {/* Home page for login */}
        <Route path="/" element={<HomePage />} />

        {/* Dashboard page for customer to see caregiver info */}
        <Route
          path="/dashboard"
          element={role === 'customer' ? <DashboardPage /> : <Navigate to="/" replace />}
        />

        {/* ChatBot page for customer to interact with assistant */}
        <Route
          path="/care"
          element={role === 'customer' ? <ChatBotPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/login"
          element={role === 'customer' ? <Login /> : <Navigate to="/" replace />}
        />
        <Route
          path="/signup"
          element={role === 'customer' ? <Signup /> : <Navigate to="/" replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;
