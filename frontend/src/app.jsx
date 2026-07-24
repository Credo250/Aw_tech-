
import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import About from './components/About';
import Portfolio from './components/Portfolio';
import Services from './components/Services';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import StatusCheck from './components/StatusCheck';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('admin_token') || '');
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem('admin_token');
    setToken('');
    navigate('/');
  }

  function handleLogin(token) {
    localStorage.setItem('admin_token', token);
    setToken(token);
    navigate('/admin');
  }

  return (
    <>
      <Navbar onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/services" element={<Services />} />
        <Route path="/admin/login" element={<AdminLogin onLogin={handleLogin} />} />
        <Route path="/admin" element={<AdminDashboard token={token} />} />
        <Route path="/status" element={<StatusCheck />} />
      </Routes>
    </>
  );
}
