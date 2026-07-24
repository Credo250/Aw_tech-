import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin({ onLogin }) {
  const [form, setForm] = useState({ username:'', password:'' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${apiBase}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(form)
      });
      const json = await res.json();
      if (json.success && json.token) {
        onLogin(json.token);
        navigate('/admin');
      } else {
        setError(json.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error');
    }
  }

  return (
    <div className="container mt-4">
      <h3>Admin Login</h3>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={submit} style={{maxWidth: 420}}>
        <div className="mb-3">
          <label>Username</label>
          <input className="form-control" value={form.username} onChange={e=>setForm({...form, username:e.target.value})} required />
        </div>
        <div className="mb-3">
          <label>Password</label>
          <input type="password" className="form-control" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required />
        </div>
        <button className="btn btn-primary" type="submit">Login</button>
      </form>
    </div>
  );
}
