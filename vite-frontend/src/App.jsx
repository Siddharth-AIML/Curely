import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import CustomerSignup from './pages/CustomerSignup.jsx';
import DoctorSignup from './pages/DoctorSignup.jsx';
// NEW LAB IMPORTS
import LabSignup from './pages/LabSignup.jsx';
import LabDashboard from './pages/LabDashboard.jsx';
import LabReports from './pages/LabReports.jsx';
import LabReportUpload from './pages/LabReportUpload.jsx';
import LabSettings from './pages/LabSettings.jsx';
// END NEW LAB IMPORTS
import PendingApproval from './pages/PendingApproval.jsx';
import CustomerDashboard from './pages/CustomerDashboard.jsx';
import DoctorDashboard from './pages/DoctorDashboard.jsx';
import CustomerAppointments from './pages/CustomerAppointment.jsx';
import DoctorAppointments from './pages/DoctorAppointments.jsx';
import DoctorPrescriptions from './pages/DoctorPrescriptions.jsx';
import DoctorReports from './pages/DoctorReports.jsx';
import CustomerPrescriptions from './pages/CustomerPrescriptions.jsx';
import CustomerReports from './pages/CustomerReports.jsx';
import CustomerSettings from './pages/CustomerSettings.jsx';
import DoctorSettings from './pages/DoctorSettings.jsx';
import SymptomChecker from './pages/SymptomChecker.jsx';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/signup/customer" element={<CustomerSignup />} />
        <Route path="/signup/doctor" element={<DoctorSignup />} />
        
        {/* NEW LAB SIGNUP ROUTE */}
        <Route path="/signup/lab" element={<LabSignup />} />
        
        <Route path="/pending-approval" element={<PendingApproval />} />
        
        {/* Customer Routes */}
        <Route path="/dashboard/customer" element={<CustomerDashboard />} />
        <Route path="/customer/appointments" element={<CustomerAppointments />} />
        <Route path="/customer/prescriptions" element={<CustomerPrescriptions />} />
        <Route path="/customer/reports" element={<CustomerReports />} />
        <Route path="/customer/settings" element={<CustomerSettings />} />
        <Route path="/customer/symptom-checker" element={<SymptomChecker />} />

        {/* Doctor Routes */}
        <Route path="/dashboard/doctor" element={<DoctorDashboard />} />
        <Route path="/doctor/appointments" element={<DoctorAppointments />} />
        <Route path="/doctor/prescriptions" element={<DoctorPrescriptions />} />
        <Route path="/doctor/reports" element={<DoctorReports />} />
        <Route path="/doctor/settings" element={<DoctorSettings />} />

        {/* NEW LAB ROUTES */}
        <Route path="/dashboard/lab" element={<LabDashboard />} />
        <Route path="/lab/reports" element={<LabReports />} /> {/* List of pending/completed tests */}
        <Route path="/lab/reports/upload/:reportId" element={<LabReportUpload />} /> {/* Report upload specific page */}
        <Route path="/lab/settings" element={<LabSettings />} />
        
      </Routes>
    </Router>
  );
}