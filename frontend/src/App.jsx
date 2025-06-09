import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate} from 'react-router-dom';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import HealthcareProviderDashboard from './pages/HealthcareProviderDashboard';
import ChatBotPage from './pages/ChatbotPage';
import LoginPage from './pages/LoginPage';
import Signup from './pages/Signup';
import QueryAssistantPage from './pages/QueryAssistantPage';
import NavigationLock from "./pages/NavigationLock";
import OverdueVaccinations from './pages/OverdueVaccinations';

function App() {
  const [userType, setUserType] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // On app load, get token & userType from localStorage
    const token = localStorage.getItem("token");
    const savedUserType = localStorage.getItem("userType");
    if (token && savedUserType) {
      setUserType(savedUserType);
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setUserType(null);
    navigate('/login', { replace: true });
  };

  const PrivateRoute = ({ children, allowedUserType }) => {
    const token = localStorage.getItem('token');
    const currentUserType = localStorage.getItem('userType');

    if (!token) {
      return <Navigate to="/login" />;
    }

    if (allowedUserType && currentUserType !== allowedUserType) {
      return <Navigate to={currentUserType === 'provider' ? '/provider-dashboard' : '/dashboard'} />;
    }

    return children;
  };

  return (
    <NavigationLock>
      <Routes>
        <Route path="/" element={<HomePage />} />
        
        <Route path="/login" element={
          !userType ? <LoginPage onLogin={(type) => setUserType(type)} /> : 
          <Navigate to={userType === 'provider' ? '/provider-dashboard' : '/dashboard'} replace />
        } />
        
        <Route path="/signup" element={
          !userType ? <Signup /> : 
          <Navigate to={userType === 'provider' ? '/provider-dashboard' : '/dashboard'} replace />
        } />

        <Route path="/dashboard" element={
          <PrivateRoute allowedUserType="child">
            <DashboardPage onLogout={handleLogout} />
          </PrivateRoute>
        } />

        <Route path="/provider-dashboard" element={
          <PrivateRoute allowedUserType="provider">
            <HealthcareProviderDashboard onLogout={handleLogout} />
          </PrivateRoute>
        } />

        <Route path="/provider/overdue-vaccinations" element={<OverdueVaccinations />} />

        <Route path="/care" element={
          <PrivateRoute allowedUserType="child">
            <ChatBotPage />
          </PrivateRoute>
        } />

        <Route path="/ask" element={
          <PrivateRoute allowedUserType="child">
            <QueryAssistantPage />
          </PrivateRoute>
        } />
        
        {/* Fallback route */}
        <Route path="*" element={
          userType ? 
          <Navigate to={userType === 'provider' ? '/provider-dashboard' : '/dashboard'} replace /> : 
          <Navigate to="/login" replace />
        } />
      </Routes>
    </NavigationLock>
  );
}

export default App;
