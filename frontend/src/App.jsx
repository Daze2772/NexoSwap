import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Import pages (we'll create them below)
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import TradeCreatePage from './pages/TradeCreatePage.jsx';
import AdminPage from './pages/AdminPage.jsx';

// Base API URL
const API_BASE = import.meta.env.VITE_API_BASE;
axios.defaults.baseURL = API_BASE;

// Axios interceptor to attach access token
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  // Logout handler
  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white shadow p-4 flex justify-between items-center">
        <div className="text-xl font-bold">
          <Link to="/">NexoSwap</Link>
        </div>
        <div className="space-x-4">
          {user && user.role === 'admin' && <Link to="/admin" className="text-sm">Admin</Link>}
          {user && <Link to="/trade" className="text-sm">New Trade</Link>}
          {user ? (
            <button onClick={logout} className="text-sm text-red-600">Logout</button>
          ) : (
            <>
              <Link to="/login" className="text-sm">Login</Link>
              <Link to="/register" className="text-sm">Register</Link>
            </>
          )}
        </div>
      </nav>
      <main className="flex-grow p-4">
        <Routes>
          <Route path="/login" element={<LoginPage setUser={setUser} />} />
          <Route path="/register" element={<RegisterPage setUser={setUser} />} />
          <Route path="/trade" element={user ? <TradeCreatePage /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user && user.role === 'admin' ? <AdminPage /> : <Navigate to="/login" />} />
          <Route path="/" element={user ? <DashboardPage user={user} /> : <Navigate to="/login" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;