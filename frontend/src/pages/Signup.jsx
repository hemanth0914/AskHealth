import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    parent_id: '',
    blood_type: '',
    pincode: '',
    username: '',
    password: ''
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:8000/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...formData,
          parent_id: parseInt(formData.parent_id)  // convert to integer if needed
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert("Signup successful. Please login.");
        navigate("/login");
      } else {
        alert(data.detail || "Signup failed.");
      }
    } catch (error) {
      alert("Signup error: " + error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form onSubmit={handleSignup} className="bg-white shadow-md rounded-lg p-6 w-full max-w-md space-y-3">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4 text-center">Sign Up</h2>
        
        <input
          type="text"
          name="first_name"
          placeholder="First Name"
          value={formData.first_name}
          onChange={handleChange}
          required
          className="w-full p-2 border border-gray-300 rounded"
        />
        <input
          type="text"
          name="last_name"
          placeholder="Last Name"
          value={formData.last_name}
          onChange={handleChange}
          required
          className="w-full p-2 border border-gray-300 rounded"
        />
        <input
          type="date"
          name="date_of_birth"
          placeholder="Date of Birth"
          value={formData.date_of_birth}
          onChange={handleChange}
          required
          className="w-full p-2 border border-gray-300 rounded"
        />
        <select
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          required
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="" disabled>Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
        <input
          type="number"
          name="parent_id"
          placeholder="Parent ID"
          value={formData.parent_id}
          onChange={handleChange}
          required
          className="w-full p-2 border border-gray-300 rounded"
        />
        <input
          type="text"
          name="blood_type"
          placeholder="Blood Type"
          value={formData.blood_type}
          onChange={handleChange}
          required
          className="w-full p-2 border border-gray-300 rounded"
        />
        <input
          type="text"
          name="pincode"
          placeholder="Pincode"
          value={formData.pincode}
          onChange={handleChange}
          required
          className="w-full p-2 border border-gray-300 rounded"
        />
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          required
          className="w-full p-2 border border-gray-300 rounded"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          className="w-full p-2 border border-gray-300 rounded"
        />

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
        >
          Sign Up
        </button>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <span className="text-blue-600 cursor-pointer" onClick={() => navigate('/login')}>
            Login
          </span>
        </p>
      </form>
    </div>
  );
};

export default Signup;
