import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate} from 'react-router-dom';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ChatBotPage from './pages/ChatbotPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import QueryAssistantPage from './pages/QueryAssistantPage';
import NavigationLock from "./pages/NavigationLock";

function App() {
  const [role, setRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // On app load, get token & role from localStorage or validate token
    const token = localStorage.getItem("token");
    const savedRole = localStorage.getItem("role"); // store role on login as well
    if (token && savedRole) {
      setRole(savedRole);
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setRole(null);
    navigate('/login', { replace: true });
  };

  return (
    <NavigationLock>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage onLogout={handleLogout} />} />
        <Route path="/care" element={role === 'customer' ? <ChatBotPage /> : <Navigate to="/login" replace />} />
        <Route path="/login" element={!role ? <Login onLogin={(r) => setRole(r)} /> : <Navigate to="/dashboard" replace />} />
        <Route path="/signup" element={!role ? <Signup /> : <Navigate to="/dashboard" replace />} />
        <Route path="/ask" element={role === 'customer' ? <QueryAssistantPage /> : <Navigate to="/login" replace />} />
        
        {/* Fallback unknown route */}
        <Route
          path="*"
          element={role ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </NavigationLock>
  );
}

export default App;
