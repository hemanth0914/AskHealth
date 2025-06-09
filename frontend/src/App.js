import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import HealthcareProviderDashboard from './pages/HealthcareProviderDashboard';
import ChatbotPage from './pages/ChatbotPage';

function App() {
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    window.location.href = '/login';
  };

  const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');

    if (!token) {
      return <Navigate to="/login" />;
    }

    // Redirect to appropriate dashboard based on user type
    if (window.location.pathname === '/dashboard' && userType === 'provider') {
      return <Navigate to="/provider-dashboard" />;
    }
    if (window.location.pathname === '/provider-dashboard' && userType === 'child') {
      return <Navigate to="/dashboard" />;
    }
    if (window.location.pathname === '/care' && userType === 'provider') {
      return <Navigate to="/provider-dashboard" />;
    }

    return children;
  };

  // Check authentication status on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    const currentPath = window.location.pathname;

    if (token) {
      // If user is logged in but on login page or root, redirect to appropriate dashboard
      if (currentPath === '/login' || currentPath === '/') {
        window.location.href = userType === 'provider' ? '/provider-dashboard' : '/dashboard';
      }
    } else {
      // If user is not logged in and not on login page, redirect to login
      if (currentPath !== '/login') {
        window.location.href = '/login';
      }
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage onLogout={handleLogout} />
            </PrivateRoute>
          }
        />
        <Route
          path="/provider-dashboard"
          element={
            <PrivateRoute>
              <HealthcareProviderDashboard onLogout={handleLogout} />
            </PrivateRoute>
          }
        />
        <Route
          path="/care"
          element={
            <PrivateRoute>
              <ChatbotPage />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App; 