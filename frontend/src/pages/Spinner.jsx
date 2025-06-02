// Spinner.jsx
import React from 'react';

const spinnerContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh', // Full screen height for centering
};

const spinnerStyle = {
  width: '50px',
  height: '50px',
  border: '5px solid rgba(0,0,0,0.1)',
  borderRadius: '50%',
  borderTopColor: '#3498db',
  animation: 'spin 1s linear infinite',
};

const Spinner = () => (
  <div style={spinnerContainerStyle}>
    <div style={spinnerStyle}></div>

    {/* Keyframes for spinning */}
    <style>
      {`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}
    </style>
  </div>
);

export default Spinner;
