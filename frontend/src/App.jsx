import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ChatBotPage from './pages/ChatbotPage';
import Login from './pages/Login';
import Signup from './pages/Signup';

function App() {
  const [role, setRole] = useState(null);

  useEffect(() => {
    // On app load, get token & role from localStorage or validate token
    const token = localStorage.getItem("token");
    const savedRole = localStorage.getItem("role"); // store role on login as well
    if (token && savedRole) {
      setRole(savedRole);
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route path="/dashboard" element={<DashboardPage onLogout={() => {
  localStorage.clear();
  setRole(null);
}} />} />

        <Route
          path="/care"
          element={role === 'customer' ? <ChatBotPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/login"
          element={!role ? <Login onLogin={(r) => setRole(r)} /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/signup"
          element={!role ? <Signup /> : <Navigate to="/dashboard" replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;
