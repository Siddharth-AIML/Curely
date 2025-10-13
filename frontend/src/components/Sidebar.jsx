import React from 'react';
import './Sidebar.css';

const Sidebar = ({ activeItem }) => {
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    window.location.href = '/login';
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Curely</h2>
      </div>
      <nav className="sidebar-nav">
        <a 
          href="/dashboard/customer" 
          className={`nav-item ${activeItem === 'dashboard' ? 'active' : ''}`}
        >
          <span className="nav-icon">📊</span>
          Dashboard
        </a>
        <a 
          href="/customer/appointments" 
          className={`nav-item ${activeItem === 'appointment' ? 'active' : ''}`}
        >
          <span className="nav-icon">📅</span>
          Book Appointment
        </a>
        <a 
          href="/customer-history" 
          className={`nav-item ${activeItem === 'history' ? 'active' : ''}`}
        >
          <span className="nav-icon">📋</span>
          Appointment History
        </a>
        <a 
          href="/customer-profile" 
          className={`nav-item ${activeItem === 'profile' ? 'active' : ''}`}
        >
          <span className="nav-icon">👤</span>
          Profile
        </a>
        <button onClick={handleLogout} className="nav-item logout-btn">
          <span className="nav-icon">🚪</span>
          Logout
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;