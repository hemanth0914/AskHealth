import React from 'react';

const VaccinationSummary = ({ patientName, summary, completed_count, upcoming_count }) => {
  // Parse the summary sections
  const parseSummary = (summaryText) => {
    if (!summaryText) return {};
    
    const sections = {};
    let currentSection = '';
    let currentContent = [];
    
    summaryText.split('\n').forEach(line => {
      if (line.trim() === '') return;
      
      // Check for section headers
      if (line.includes('📅 Upcoming Vaccinations:')) {
        currentSection = 'upcoming';
        currentContent = [];
      } else if (line.includes('✅ Completed Vaccinations:')) {
        currentSection = 'completed';
        currentContent = [];
      } else if (line.includes('⚠️ Delayed Vaccinations:')) {
        currentSection = 'delayed';
        currentContent = [];
      } else if (line.includes('🚫 Missed Mandatory Vaccinations:')) {
        currentSection = 'missed';
        currentContent = [];
      } else if (line.includes('⚪ Optional Vaccinations Not Taken:')) {
        currentSection = 'optional';
        currentContent = [];
      } else if (!line.includes('Statistics:')) {
        currentContent.push(line.trim());
        if (currentSection) {
          sections[currentSection] = currentContent;
        }
      }
    });
    
    return sections;
  };

  const sections = parseSummary(summary);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 space-y-6">
      {/* Patient Info */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
          <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{patientName}</h2>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-sm font-medium text-gray-600">Completed</p>
          <p className="mt-1 text-2xl font-semibold text-green-600">
            {completed_count}
          </p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-sm font-medium text-gray-600">Upcoming</p>
          <p className="mt-1 text-2xl font-semibold text-blue-600">
            {upcoming_count}
          </p>
        </div>
      </div>

      {/* Upcoming Vaccinations */}
      {sections.upcoming && sections.upcoming.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Upcoming Vaccinations
          </h3>
          <div className="space-y-3">
            {sections.upcoming.map((vaccine, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:shadow-sm transition-shadow duration-200">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{vaccine}</h4>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Vaccinations */}
      {sections.completed && sections.completed.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Completed Vaccinations
          </h3>
          <div className="space-y-3">
            {sections.completed.map((vaccine, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{vaccine}</h4>
                  </div>
                </div>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Completed
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delayed Vaccinations */}
      {sections.delayed && sections.delayed.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <svg className="h-5 w-5 text-yellow-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Delayed Vaccinations
          </h3>
          <div className="space-y-3">
            {sections.delayed.map((vaccine, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-white rounded-xl border border-yellow-100">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{vaccine}</h4>
                  </div>
                </div>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Delayed
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missed Vaccinations */}
      {sections.missed && sections.missed.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Missed Vaccinations
          </h3>
          <div className="space-y-3">
            {sections.missed.map((vaccine, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-white rounded-xl border border-red-100">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                      <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{vaccine}</h4>
                  </div>
                </div>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Missed
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VaccinationSummary; 