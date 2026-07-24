import React, { useState, useEffect } from 'react';

export default function ApplyModal({ show, onClose }) {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', secondaryLevel: 'level3', school: '' });
  const [payslip, setPayslip] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (previewURL) URL.revokeObjectURL(previewURL);
    };
  }, [previewURL]);

  if (!show) return null;

  const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) {
      setPayslip(null);
      setPreviewURL(null);
      return;
    }
    const maxSize = 6 * 1024 * 1024;
    if (file.size > maxSize) {
      setMessage('Payslip too large. Please upload a file smaller than 6 MB.');
      e.target.value = '';
      setPayslip(null);
      setPreviewURL(null);
      return;
    }
    setMessage('');
    setPayslip(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewURL(url);
    } else {
      setPreviewURL(null);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    setSubmitting(true);

    if (!form.fullName || !form.email || !form.secondaryLevel) {
      setMessage('Please fill required fields.');
      setSubmitting(false);
      return;
    }

    const data = new FormData();
    Object.keys(form).forEach(k => data.append(k, form[k]));
    if (payslip) data.append('payslip', payslip);

    try {
      const res = await fetch(`${apiBase}/api/apply`, { method: 'POST', body: data });
      const json = await res.json();
      if (json.success) {
        setMessage(json.message || 'Application submitted.');
        setForm({ fullName: '', email: '', phone: '', secondaryLevel: 'level3', school: '' });
        setPayslip(null);
        setPreviewURL(null);
      } else {
        setMessage('Error: ' + (json.error || 'Unknown error'));
      }
    } catch (err) {
      setMessage('Network error. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal show d-block" tabIndex="-1" role="dialog">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header">
              <h5 className="modal-title">Apply for Industrial Attachment</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>

            <div className="modal-body">
              {message && <div className="alert alert-info">{message}</div>}

              <div className="row">
                <div className="col-md-7">
                  <div className="mb-3">
                    <label className="form-label">Full name</label>
                    <input required className="form-control" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input required type="email" className="form-control" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>

                  <div className="mb-3 row">
                    <div className="col">
                      <label>Phone</label>
                      <input className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                    </div>
                    <div className="col">
                      <label>Secondary level</label>
                      <select className="form-select" value={form.secondaryLevel} onChange={e => setForm({ ...form, secondaryLevel: e.target.value })}>
                        <option value="level3">Level 3</option>
                        <option value="level4">Level 4</option>
                        <option value="level5">Level 5</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label>School</label>
                    <input className="form-control" value={form.school} onChange={e => setForm({ ...form, school: e.target.value })} />
                  </div>
                </div>

                <div className="col-md-5">
                  <div className="mb-3">
                    <label className="form-label">Payslip (image/pdf) — to confirm payment</label>
                    <input type="file" accept="image/*,application/pdf" className="form-control" onChange={handleFile} />
                    <small className="text-muted">Max 6 MB. Images previewed below.</small>
                  </div>

                  {payslip && (
                    <div className="card preview-card">
                      <div className="card-body">
                        <p className="mb-1"><strong>Selected file:</strong> {payslip.name} ({Math.round(payslip.size / 1024)} KB)</p>
                        {previewURL ? (
                          <img src={previewURL} alt="preview" className="img-fluid border rounded" />
                        ) : (
                          <p className="text-muted small">No preview available for this file type (PDF or non-image).</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>Close</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Application'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
