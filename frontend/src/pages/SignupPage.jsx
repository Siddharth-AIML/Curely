import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

export default function SignupPage() {
    const navigate = useNavigate();
    
    const handleUserTypeSelection = (type) => {
        // Navigate to the appropriate signup page
        if (type === 'customer') {
            navigate('/signup/customer');
        } else {
            navigate('/signup/doctor');
        }
    };
   
    return (
        <div className="auth-container">
            <h2>Sign-up as</h2>
            <div className="user-type-container">
                <button 
                    className="user-type-button"
                    onClick={() => handleUserTypeSelection('customer')}
                >
                    <span>Customer</span>
                    <p>Access your health records</p>
                </button>
                <button 
                    className="user-type-button"
                    onClick={() => handleUserTypeSelection('doctor')}
                >
                    <span>Doctor</span>
                    <p>Provide healthcare services</p>
                </button>
            </div>
            <p className="login-link">
                Already have an account? <a href="/login">Login</a>
            </p>
        </div>
    )
}