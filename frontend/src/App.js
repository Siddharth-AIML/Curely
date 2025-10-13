import React from 'react'
import {BrowserRouter as Router,Routes, Route} from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import './App.css';
import CustomerSignup from './pages/CustomerSignup';
import DoctorSignup from './pages/DoctorSignup';
import CustomerDashboard from './pages/CustomerDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import PendingApproval from './pages/PendingApproval';
import CustomerAppointments from './pages/CustomerAppointment';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage/>}/>
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/signup" element={<SignupPage/>}/>
        <Route path="/signup/customer" element={<CustomerSignup/>}/>
        <Route path="/signup/doctor" element={<DoctorSignup/>}/>
        <Route path="/dashboard/customer" element={<CustomerDashboard/>}/>
        <Route path="/dashboard/doctor" element={<DoctorDashboard/>}/>
        <Route path="/pending-approval" element={<PendingApproval/>}/>
        <Route path="/customer/appointments/" element={<CustomerAppointments/>}/>
      </Routes>
    </Router>
  );
}

export default App;
