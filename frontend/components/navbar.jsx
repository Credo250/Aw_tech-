import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar({ onLogout }) {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light fixed-top shadow-sm">
      <div className="container">
        <Link className="navbar-brand" to="/">AW_Tech (Muhang)</Link>
        <button className="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#nav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div id="nav" className="collapse navbar-collapse">
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item"><Link className="nav-link" to="/">Home</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/about">About Us</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/portfolio">Portfolio</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/services">Services</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/status">Application Status</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/admin/login">Admin</Link></li>
            <li className="nav-item"><button className="btn btn-outline-secondary ms-2" onClick={onLogout}>Logout</button></li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
