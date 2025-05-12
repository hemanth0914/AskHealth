import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();

  const handleNavigateToDashboard = () => {
    // Navigate directly to the dashboard page
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-green-100 flex flex-col items-center justify-center text-center px-4">
      <div className="bg-white shadow-xl rounded-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">Welcome to the Mother & Child Care Platform</h1>
        <p className="text-lg text-gray-600 mb-6">
          Our platform provides personalized care and advice for mothers and their children. Whether you're seeking advice on health, feeding, or vaccinations, we're here to guide you.
        </p>
        
        <p className="text-gray-600 mb-6">
          Please provide the necessary details about the mother and child to get personalized care recommendations and assistance.
        </p>

        {/* Button to navigate directly to the Dashboard */}
        <button
          onClick={handleNavigateToDashboard}
          className="w-full px-4 bg-blue-600 text-white py-2 rounded-full text-lg font-medium hover:bg-blue-700 transition"
        >
          Go to Dashboard
        </button>
      </div>

      <footer className="mt-12 text-sm text-gray-400">
        &copy; {new Date().getFullYear()} Mother & Child Care Platform
      </footer>
    </div>
  );
};

export default HomePage;
