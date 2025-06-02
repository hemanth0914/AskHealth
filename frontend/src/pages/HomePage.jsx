import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: "Vaccination Tracking",
      description: "Keep track of your child's immunization schedule and receive timely reminders.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: "24/7 Health Support",
      description: "Connect with healthcare providers anytime through chat or call.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      )
    },
    {
      title: "Health Records",
      description: "Securely store and access your child's health records anytime, anywhere.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
  ];

  return (
    <main className="min-h-screen bg-[#f5f5f7] font-sans antialiased">
      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[40%] -left-[20%] w-[800px] h-[800px] rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-3xl transform rotate-12 animate-pulse" />
          <div className="absolute -bottom-[40%] -right-[20%] w-[800px] h-[800px] rounded-full bg-gradient-to-l from-blue-400/20 to-purple-400/20 blur-3xl transform -rotate-12 animate-pulse" />
        </div>

        {/* Navigation */}
        <nav className="relative z-10 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  HealthCare Connect
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/login')}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Sign in
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity duration-200"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-semibold text-gray-900 mb-6">
              Your Child's Health Journey{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Starts Here
              </span>
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Comprehensive healthcare management for your child. Track vaccinations, connect with providers, and access health records - all in one place.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/signup')}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl text-lg font-medium hover:opacity-90 transition-all duration-200 transform hover:scale-105"
              >
                Start Your Journey
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto bg-white/80 backdrop-blur-xl text-gray-700 px-8 py-3 rounded-xl text-lg font-medium border border-gray-200/50 hover:bg-white/90 transition-all duration-200 transform hover:scale-105"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-semibold text-gray-900 mb-4">
              Everything You Need
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools and features designed to support your child's health journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 transform transition-all duration-300 hover:scale-105"
              >
                <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 flex items-center justify-center mb-4">
                  <div className="text-blue-600">
                    {feature.icon}
                  </div>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h4>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-semibold text-gray-900 mb-4">
            Ready to Get Started?
          </h3>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of parents who trust HealthCare Connect for their children's health management.
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl text-lg font-medium hover:opacity-90 transition-all duration-200 transform hover:scale-105"
          >
            Create Your Account
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-4 border-t border-gray-200/50">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-600 mb-4">
            Protected by enterprise-grade security
          </p>
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} HealthCare Connect. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Add smooth scrolling and transitions */}
      <style jsx>{`
        html {
          scroll-behavior: smooth;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 0.5;
          }
          50% {
            opacity: 0.3;
          }
        }

        .animate-pulse {
          animation: pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </main>
  );
};

export default HomePage;
