import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import './CustomerAppointment.css';

export default function CustomerAppointments() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointmentData, setAppointmentData] = useState({
    date: '',
    time: '',
    reason: '',
    priority: 'normal'
  });
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/doctor/get-doctor', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDoctors(data);
      } else {
        setMessage('Failed to fetch doctors');
      }
    } catch (error) {
      setMessage('Error fetching doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = (doctor) => {
    setSelectedDoctor(doctor);
    setShowBookingForm(true);
  };

  const handleSubmitAppointment = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          doctor_id: selectedDoctor._id,
          appointment_date: appointmentData.date,
          appointment_time: appointmentData.time,
          reason: appointmentData.reason,
          priority: appointmentData.priority
        })
      });

      if (response.ok) {
        setMessage('Appointment requested successfully!');
        setShowBookingForm(false);
        setAppointmentData({ date: '', time: '', reason: '', priority: 'normal' });
        setSelectedDoctor(null);
      } else {
        const error = await response.json();
        setMessage(error.message || 'Failed to book appointment');
      }
    } catch (error) {
      setMessage('Error booking appointment');
    }
  };

  const handleInputChange = (e) => {
    setAppointmentData({
      ...appointmentData,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <Sidebar activeItem="appointment" />
        <div className="main-content">
          <div className="appointments-bg">
            <div className="appointments-container">
              <div className="appointments-loading">Loading doctors...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar activeItem="appointment" />
      <div className="main-content">
        <div className="appointments-bg">
          <div className="appointments-container">
            <div className="appointments-header">
              <h1 className="appointments-title">Book an Appointment</h1>
              <p className="appointments-subtitle">Choose from our qualified doctors</p>
            </div>

            {message && (
              <div className={`appointments-message ${message.includes('successfully') ? 'success' : 'error'}`}>
                {message}
              </div>
            )}

            <div className="doctors-grid">
              {doctors.map((doctor) => (
                <div key={doctor._id} className="doctor-card">
                  <div className="doctor-avatar">
                    <span className="doctor-initial">{doctor.name?.charAt(0) || 'D'}</span>
                  </div>
                  
                  <div className="doctor-info">
                    <h3 className="doctor-name">Dr. {doctor.name}</h3>
                    <p className="doctor-specialty">{doctor.specialization}</p>
                    <p className="doctor-qualification">{doctor.qualification}</p>
                    
                    <div className="doctor-details">
                      <div className="doctor-detail-item">
                        <span className="detail-label">Experience</span>
                        <span className="detail-value">{doctor.experience} years</span>
                      </div>
                      
                      <div className="doctor-detail-item">
                        <span className="detail-label">Consultation Fee</span>
                        <span className="detail-value">₹{doctor.fee}</span>
                      </div>
                      
                      <div className="doctor-detail-item">
                        <span className="detail-label">Hospital</span>
                        <span className="detail-value">{doctor.clinic_name}</span>
                      </div>
                      
                      <div className="doctor-detail-item">
                        <span className="detail-label">Location</span>
                        <span className="detail-value">{doctor.city}</span>
                      </div>
                    </div>
                    
                    <button 
                      className="book-appointment-btn"
                      onClick={() => handleBookAppointment(doctor)}
                    >
                      Book Appointment
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {showBookingForm && (
              <div className="booking-modal">
                <div className="booking-form-container">
                  <div className="booking-form-header">
                    <h3>Book Appointment with Dr. {selectedDoctor?.name}</h3>
                    <button 
                      className="close-modal-btn"
                      onClick={() => setShowBookingForm(false)}
                    >
                      ×
                    </button>
                  </div>
                  
                  <form onSubmit={handleSubmitAppointment} className="booking-form">
                    <div className="form-group">
                      <label htmlFor="date">Preferred Date</label>
                      <input
                        type="date"
                        id="date"
                        name="date"
                        value={appointmentData.date}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="time">Preferred Time</label>
                      <select
                        id="time"
                        name="time"
                        value={appointmentData.time}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Time</option>
                        <option value="09:00">09:00 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="11:00">11:00 AM</option>
                        <option value="12:00">12:00 PM</option>
                        <option value="14:00">02:00 PM</option>
                        <option value="15:00">03:00 PM</option>
                        <option value="16:00">04:00 PM</option>
                        <option value="17:00">05:00 PM</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="reason">Reason for Visit</label>
                      <textarea
                        id="reason"
                        name="reason"
                        value={appointmentData.reason}
                        onChange={handleInputChange}
                        placeholder="Describe your symptoms or reason for consultation"
                        rows="4"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="priority">Priority</label>
                      <select
                        id="priority"
                        name="priority"
                        value={appointmentData.priority}
                        onChange={handleInputChange}
                      >
                        <option value="normal">Normal</option>
                        <option value="urgent">Urgent</option>
                        <option value="emergency">Emergency</option>
                      </select>
                    </div>
                    
                    <div className="form-actions">
                      <button type="button" onClick={() => setShowBookingForm(false)} className="cancel-btn">
                        Cancel
                      </button>
                      <button type="submit" className="submit-btn">
                        Book Appointment
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
