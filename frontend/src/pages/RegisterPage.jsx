import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function RegisterPage({ setUser }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', address: '', password: '' });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await axios.post('/auth/register', form);
      const { user, accessToken, refreshToken } = res.data;
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setUser(user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-md p-6 rounded-md">
      <h2 className="text-2xl font-semibold mb-4">Register</h2>
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input type="text" name="name" value={form.name} onChange={handleChange} className="w-full border border-gray-300 rounded p-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full border border-gray-300 rounded p-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Address</label>
          <input type="text" name="address" value={form.address} onChange={handleChange} className="w-full border border-gray-300 rounded p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} className="w-full border border-gray-300 rounded p-2" required />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Register</button>
      </form>
      <p className="text-sm mt-4 text-center">Already have an account? <Link to="/login" className="text-blue-600">Login</Link></p>
    </div>
  );
}

export default RegisterPage;