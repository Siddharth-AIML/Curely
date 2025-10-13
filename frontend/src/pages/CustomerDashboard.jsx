import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from '../components/Sidebar';
import './CustomerDashboard.css';

export default function CustomerDashboard() {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
        return;
      }
      const res = await fetch("http://localhost:3001/api/customer/profile", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data);
      } else {
        alert(data.msg || "Failed to fetch profile");
      }
    };
    fetchProfile();
  }, []);

  const handleMenuClick = (page) => {
    switch(page) {
      case 'appointments':
        navigate('/customer/appointments');
        break;
      case 'records':
        // navigate('/health-records');
        console.log('Health Records - Coming soon');
        break;
      case 'messages':
        // navigate('/messages');
        console.log('Messages - Coming soon');
        break;
      case 'settings':
        // navigate('/settings');
        console.log('Settings - Coming soon');
        break;
      default:
        break;
    }
  };

  // Placeholder data for demo sections
  const nextAppointment = {
    doctor: "Dr. Emily Carter",
    type: "General Checkup",
    date: "July 15, 2024",
    time: "10:00 AM",
  };
  const healthRecords = [
    {
      label: "Recent Blood Test Results",
      value: "Last Updated: June 20, 2024",
    },
    {
      label: "Allergy Information",
      value: "Last Updated: May 15, 2024",
    },
  ];
  const messages = [
    {
      label: "Messages with Dr. Carter",
      value: "Last Message: Today, 9:00 AM",
    },
  ];
  const healthTips = [
    {
      label: "Stay Hydrated",
      value: "Drinking enough water is essential for overall health and well-being.",
    },
  ];

  return (
    <div className="dashboard-container">
      <Sidebar activeItem="dashboard" />
      <div className="main-content">
        <div className="customer-dashboard-bg">
          <div className="customer-dashboard-container">
            {/* Sidebar */}
            {/* <aside className="customer-dashboard-sidebar">
              <img
                src="#"
                alt="Profile"
                className="customer-dashboard-avatar"
              />
              <div className="customer-dashboard-name">
                {profile ? profile.name : "Customer"}
              </div>
              <nav className="customer-dashboard-menu">
                <div className="customer-dashboard-menu-item active">
                  <span role="img" aria-label="dashboard">🏠</span> Dashboard
                </div>
                <div 
                  className="customer-dashboard-menu-item"
                  onClick={() => handleMenuClick('appointments')}
                >
                  <span role="img" aria-label="appointments">📅</span> Appointments
                </div>
                <div 
                  className="customer-dashboard-menu-item"
                  onClick={() => handleMenuClick('records')}
                >
                  <span role="img" aria-label="records">📄</span> Health Records
                </div>
                <div 
                  className="customer-dashboard-menu-item"
                  onClick={() => handleMenuClick('messages')}
                >
                  <span role="img" aria-label="messages">✉️</span> Messages
                </div>
                <div 
                  className="customer-dashboard-menu-item"
                  onClick={() => handleMenuClick('settings')}
                >
                  <span role="img" aria-label="settings">⚙️</span> Settings
                </div>
              </nav>
            </aside> */}
            {/* Main Content */}
            <main className="customer-dashboard-main">
              <section className="customer-dashboard-section">
                <div className="customer-dashboard-welcome">
                  Welcome back{profile ? `, ${profile.name}` : ""}!
                </div>
                <div className="customer-dashboard-label">
                  Med_ID: <span className="customer-dashboard-value">{profile?.med_id}</span>
                </div>
                <div className="customer-dashboard-label">
                  Email: <span className="customer-dashboard-value">{profile?.email}</span>
                </div>
              </section>

              <section className="customer-dashboard-section">
                <div className="customer-dashboard-section-title">Upcoming Appointments</div>
                <div className="customer-dashboard-appointment">
                  <div className="customer-dashboard-appointment-info">
                    <div className="customer-dashboard-label">Next Appointment</div>
                    <div className="customer-dashboard-value">{nextAppointment.doctor}</div>
                    <div className="customer-dashboard-label">
                      {nextAppointment.type} · {nextAppointment.date} · {nextAppointment.time}
                    </div>
                  </div>
                </div>
              </section>

              <section className="customer-dashboard-section">
                <div className="customer-dashboard-section-title">Health Records</div>
                {healthRecords.map((rec, i) => (
                  <div className="customer-dashboard-record" key={i}>
                    <div className="customer-dashboard-record-info">
                      <div className="customer-dashboard-value">{rec.label}</div>
                      <div className="customer-dashboard-label">{rec.value}</div>
                    </div>
                  </div>
                ))}
              </section>

              <section className="customer-dashboard-section">
                <div className="customer-dashboard-section-title">Communication</div>
                {messages.map((msg, i) => (
                  <div className="customer-dashboard-message" key={i}>
                    <div className="customer-dashboard-message-info">
                      <div className="customer-dashboard-value">{msg.label}</div>
                      <div className="customer-dashboard-label">{msg.value}</div>
                    </div>
                  </div>
                ))}
              </section>

              <section className="customer-dashboard-section">
                <div className="customer-dashboard-section-title">Health Tips</div>
                {healthTips.map((tip, i) => (
                  <div className="customer-dashboard-tip" key={i}>
                    <div className="customer-dashboard-tip-info">
                      <div className="customer-dashboard-value">{tip.label}</div>
                      <div className="customer-dashboard-label">{tip.value}</div>
                    </div>
                  </div>
                ))}
              </section>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
