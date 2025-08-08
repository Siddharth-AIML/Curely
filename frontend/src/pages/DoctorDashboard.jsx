import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function DoctorDashboard() {
  const [loading, setLoading] = useState(true);
  const [doctorData, setDoctorData] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoctorProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const res = await fetch("http://localhost:3001/api/doctor/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.message || "Error fetching profile");
          setLoading(false);
          return;
        }

        setDoctorData(data);
        setLoading(false);
      } catch (err) {
        setError("Server error");
        setLoading(false);
      }
    };

    fetchDoctorProfile();
  }, [navigate]);

  if (loading) {
    return <h2>Loading...</h2>;
  }

  if (error) {
    return <h3 style={{ color: "red" }}>{error}</h3>;
  }

  // Main dashboard for verified doctor
  return (
    <div className="doctor-dashboard" style={{ padding: "32px", maxWidth: 700, margin: "0 auto" }}>
      <div
        style={{
          background: "var(--bg-secondary, #fff)",
          borderRadius: "16px",
          boxShadow: "0 4px 24px rgba(115,99,114,0.08)",
          padding: "2.5rem 2rem",
          marginBottom: "2rem",
        }}
      >
        <h2 style={{ color: "var(--chinese-violet, #736372)", marginBottom: 8 }}>
          Welcome, Dr. {doctorData.name}
        </h2>
        <div style={{ color: "var(--text-medium, #736372)", marginBottom: 16 }}>
          <span style={{ marginRight: 24 }}>
            <strong>Specialization:</strong> {doctorData.specialization}
          </span>
          <span>
            <strong>Email:</strong> {doctorData.email}
          </span>
        </div>
        <div
          style={{
            background: "var(--nyanza, #dceed1)",
            borderRadius: "8px",
            padding: "1rem 1.5rem",
            marginBottom: "1.5rem",
            color: "var(--chinese-violet, #736372)",
            fontWeight: 500,
          }}
        >
          <div>
            <strong>Clinic:</strong> {doctorData.clinicName}
          </div>
          <div>
            <strong>Experience:</strong> {doctorData.experience} years
          </div>
          <div>
            <strong>Consultation Fee:</strong> ₹{doctorData.fee}
          </div>
          <div>
            <strong>Working Hours:</strong> {doctorData.workingHours}
          </div>
          <div>
            <strong>Location:</strong> {doctorData.address}, {doctorData.city}, {doctorData.state}, {doctorData.country} - {doctorData.pincode}
          </div>
        </div>
      </div>
      <div>
        <h3 style={{ color: "var(--chinese-violet, #736372)" }}>Dashboard</h3>
        <ul style={{ color: "var(--text-medium, #736372)", fontSize: "1.08rem", lineHeight: 2 }}>
          <li>View and manage appointments</li>
          <li>Update your profile and availability</li>
          <li>See patient requests and history</li>
          <li>Access analytics and feedback</li>
        </ul>
      </div>
    </div>
  );
}
