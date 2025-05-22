import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState(''); // changed from email to username
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    // Prepare form data instead of JSON
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const response = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: formData.toString()
      });

      const data = await response.json();

      if (response.ok && data.access_token) {
        localStorage.setItem("token", data.access_token); // store JWT
        localStorage.setItem("userEmail", username); // optional
        localStorage.setItem("role", "customer"); // or get role from backend if available
        onLogin("customer"); // notify App of login
        navigate("/dashboard");
      } else {
        alert(data.detail || "Login failed.");
      }
    } catch (error) {
      alert("Login error: " + error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form onSubmit={handleLogin} className="bg-white shadow-md rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4 text-center">Login</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full mb-3 p-2 border border-gray-300 rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 p-2 border border-gray-300 rounded"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Log In
        </button>
        <p className="mt-4 text-center text-sm text-gray-600">
          Don’t have an account?{' '}
          <span className="text-blue-600 cursor-pointer" onClick={() => navigate('/signup')}>
            Sign up
          </span>
        </p>
      </form>
    </div>
  );
};

export default Login;
