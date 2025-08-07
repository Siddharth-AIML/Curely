import React from 'react'
import {BrowserRouter as Router,Routes, Route} from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import './App.css';
import CustomerSignup from './pages/CustomerSignup';
import DoctorSignup from './pages/DoctorSignup';



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage/>}/>
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/signup" element={<SignupPage/>}/>
        <Route path="/signup/customer" element={<CustomerSignup/>}/>
        <Route path="/signup/doctor" element={<DoctorSignup/>}/>
      </Routes>
    </Router>
  );
}

export default App;
