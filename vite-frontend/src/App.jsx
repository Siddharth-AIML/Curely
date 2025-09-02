import React from 'react'
import {BrowserRouter as Router,Routes, Route, BrowserRouter} from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import DoctorSignup from './pages/DoctorSignup';
import CustomerSignup from './pages/CustomerSignup';
import CustomerDashboard from './pages/CustomerDashboard';
import CustomerAppointments from './pages/CustomerAppointment';
import PendingApproval from './pages/PendingApproval';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorAppointments from './pages/DoctorAppointments';
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage/>}/>
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/signup" element={<SignupPage/>}/>
        <Route path="/signup/doctor" element={<DoctorSignup/>}/>
        <Route path="/signup/customer" element={<CustomerSignup/>}/>
        <Route path="/dashboard/customer" element={<CustomerDashboard/>}/>
        <Route path="/customer/appointments" element={<CustomerAppointments/>}/>
        <Route path="/pending-approval" element={<PendingApproval/>}/>
        <Route path="/dashboard/doctor" element={<DoctorDashboard/>}/>
        <Route path="/doctor/appointments" element={<DoctorAppointments/>}/>

      </Routes>
    </BrowserRouter>
  )
}
