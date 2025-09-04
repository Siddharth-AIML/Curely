import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CustomerSignup from './pages/CustomerSignup';
import DoctorSignup from './pages/DoctorSignup';
import PendingApproval from './pages/PendingApproval';
import CustomerDashboard from './pages/CustomerDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import CustomerAppointments from './pages/CustomerAppointment';
import DoctorAppointments from './pages/DoctorAppointments';
import DoctorPrescriptions from './pages/DoctorPrescriptions';
import DoctorReports from './pages/DoctorReports';
import CustomerPrescriptions from './pages/CustomerPrescriptions';
import CustomerReports from './pages/CustomerReports';

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth & Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/signup/customer" element={<CustomerSignup />} />
        <Route path="/signup/doctor" element={<DoctorSignup />} />
        <Route path="/pending-approval" element={<PendingApproval />} />

        {/* Customer Routes */}
        <Route path="/dashboard/customer" element={<CustomerDashboard />} />
        <Route path="/customer/appointments" element={<CustomerAppointments />} />
        <Route path="/customer/prescriptions" element={<CustomerPrescriptions />} />
        <Route path="/customer/reports" element={<CustomerReports />} />

        {/* Doctor Routes */}
        <Route path="/dashboard/doctor" element={<DoctorDashboard />} />
        <Route path="/doctor/appointments" element={<DoctorAppointments />} />
        <Route path="/doctor/prescriptions" element={<DoctorPrescriptions />} />
        <Route path="/doctor/reports" element={<DoctorReports />} />
      </Routes>
    </Router>
  );
}

export default App;
