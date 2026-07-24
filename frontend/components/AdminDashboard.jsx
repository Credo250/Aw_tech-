import React, { useEffect, useState } from 'react';

export default function AdminDashboard({ token }) {
  const [apps, setApps] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);

  const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

  useEffect(() => {
    if (!token) return;
    loadStats();
    loadApps();
    // eslint-disable-next-line
  }, [token, page, statusFilter]);

  async function loadStats() {
    try {
      const res = await fetch(`${apiBase}/api/admin/stats`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      if (res.status === 401) return;
      const json = await res.json();
      setStats(json);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadApps() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (query) params.append('q', query);
      params.append('page', page);
      params.append('limit', limit);
      const res = await fetch(`${apiBase}/api/admin/apps?${params.toString()}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      if (res.status === 401) {
        setApps([]);
        setLoading(false);
        return;
      }
      const json = await res.json();
      setApps(json.data || []);
      setTotal(json.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function search(e) {
    e && e.preventDefault();
    setPage(1);
    await loadApps();
    await loadStats();
  }

  async function approve(id) {
    await fetch(`${apiBase}/api/admin/approve/${id}`, {
      method: 'POST',
      headers: { Authorization: token ? `Bearer ${token}` : '' }
    });
    await loadApps();
    await loadStats();
  }
  async function reject(id) {
    await fetch(`${apiBase}/api/admin/reject/${id}`, {
      method: 'POST',
      headers: { Authorization: token ? `Bearer ${token}` : '' }
    });
    await loadApps();
    await loadStats();
  }

  async function exportCSV() {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (query) params.append('q', query);
      const res = await fetch(`${apiBase}/api/admin/export?${params.toString()}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      if (!res.ok) {
        alert('CSV export failed');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `awtech-applications-${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Export error');
    }
  }

  const totalPages = Math.ceil((total || 0) / limit) || 1;

  if (!token) return <div className="container mt-4"><div className="alert alert-warning">Please login as admin to view this page.</div></div>;

  return (
    <div className="container mt-4">
      <h3>Admin Dashboard</h3>

      <div className="row mb-3">
        <div className="col-sm-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">Pending</h5>
              <p className="display-6 mb-0">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="col-sm-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">Approved</h5>
              <p className="display-6 mb-0">{stats.approved}</p>
            </div>
          </div>
        </div>
        <div className="col-sm-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">Rejected</h5>
              <p className="display-6 mb-0">{stats.rejected}</p>
            </div>
          </div>
        </div>
        <div className="col-sm-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">Total</h5>
              <p className="display-6 mb-0">{stats.total}</p>
            </div>
          </div>
        </div>
      </div>

      <form className="row g-2 align-items-end mb-3" onSubmit={search}>
        <div className="col-md-4">
          <label className="form-label">Search (name, email, phone)</label>
          <input className="form-control" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search..." />
        </div>
        <div className="col-md-3">
          <label className="form-label">Status filter</label>
          <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="col-md-5">
          <div>
            <button className="btn btn-primary me-2" onClick={search} type="submit">Search</button>
            <button type="button" className="btn btn-outline-secondary me-2" onClick={() => { setQuery(''); setStatusFilter(''); setPage(1); setTimeout(loadApps, 0); }}>Reset</button>
            <button type="button" className="btn btn-success" onClick={exportCSV}>Export CSV</button>
          </div>
        </div>
      </form>

      {loading ? <div>Loading...</div> : (
        <>
          {apps.length === 0 ? <div className="alert alert-info">No applications found.</div> : (
            <div className="list-group mb-3">
              {apps.map(p => (
                <div key={p._id} className="list-group-item">
                  <div className="d-flex justify-content-between">
                    <div>
                      <strong>{p.fullName}</strong> — {p.secondaryLevel} — <small className="text-muted">{new Date(p.createdAt).toLocaleString()}</small>
                      <div>Email: {p.email} | Phone: {p.phone}</div>
                      <div>Status: <span className={`badge ${p.status === 'pending' ? 'bg-warning text-dark' : p.status === 'approved' ? 'bg-success' : 'bg-danger'}`}>{p.status}</span> &nbsp; Class: {p.classAssigned || '-'}</div>
                      {p.payslipPath && <div className="mt-1"><a href={`${apiBase}/${p.payslipPath}`} target="_blank" rel="noreferrer">View payslip</a></div>}
                      {p.admissionLetterPath && <div className="mt-1"><a href={`${apiBase}/${p.admissionLetterPath}`} target="_blank" rel="noreferrer">Download admission letter</a></div>}
                    </div>
                    <div className="btn-group-vertical">
                      {p.status !== 'approved' && <button className="btn btn-success mb-1" onClick={() => approve(p._id)}>Approve</button>}
                      {p.status !== 'rejected' && <button className="btn btn-danger" onClick={() => reject(p._id)}>Reject</button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <nav>
            <ul className="pagination">
              <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}><button className="page-link" onClick={() => { if (page > 1) { setPage(page - 1); setTimeout(loadApps, 0); } }}>Previous</button></li>
              <li className="page-item disabled"><span className="page-link">Page {page} / {totalPages}</span></li>
              <li className={`page-item ${page >= totalPages ? 'disabled' : ''}`}><button className="page-link" onClick={() => { if (page < totalPages) { setPage(page + 1); setTimeout(loadApps, 0); } }}>Next</button></li>
            </ul>
          </nav>
        </>
      )}
    </div>
  );
}
