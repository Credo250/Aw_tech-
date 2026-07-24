import React, { useState } from 'react';

export default function StatusCheck() {
  const [email, setEmail] = useState('');
  const [apps, setApps] = useState([]);
  const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

  async function lookup(e) {
    e.preventDefault();
    const res = await fetch(`${apiBase}/api/status?email=${encodeURIComponent(email)}`);
    const json = await res.json();
    setApps(json);
  }

  return (
    <div className="container mt-4">
      <h3>Check Application Status</h3>
      <form onSubmit={lookup} style={{maxWidth: 560}}>
        <div className="mb-3">
          <label>Enter your email</label>
          <input type="email" className="form-control" value={email} onChange={e=>setEmail(e.target.value)} required />
        </div>
        <button className="btn btn-primary" type="submit">Lookup</button>
      </form>

      <div className="mt-4">
        {apps.length === 0 && <div className="text-muted">No applications found.</div>}
        {apps.map(a => (
          <div key={a._id} className="card mb-2">
            <div className="card-body">
              <h5 className="card-title">{a.fullName} — {a.status}</h5>
              <p>Applied: {new Date(a.createdAt).toLocaleString()}</p>
              <p>Secondary level: {a.secondaryLevel} | Class: {a.classAssigned || '-'}</p>
              {a.admissionLetterPath && <a className="btn btn-sm btn-outline-primary" href={`${apiBase}/${a.admissionLetterPath}`} target="_blank" rel="noreferrer">Download Admission Letter</a>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
