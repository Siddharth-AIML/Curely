import React, { useState } from "react";
// 💡 CORRECTED IMPORTS: Added CheckCircle and XCircle
import { useNavigate, Link } from "react-router-dom";
import { Building, Mail, Phone, Lock, MapPin, HeartPulse, Stethoscope, CheckCircle, XCircle } from 'lucide-react'; 
// Corrected API import path
import { signupLab } from '/src/services/api.js'; 

// Helper component for styled input fields
// 💡 PROP CHANGE: Changed 'Icon' prop to 'icon' (lowercase)
const InputField = ({ icon: Icon, label, ...props }) => (
    <div>
        <label htmlFor={props.name} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <div className="relative">
            {Icon && <Icon size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-400" />}
            <input 
                {...props} 
                id={props.name} 
                className={`w-full px-4 py-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none ${Icon ? 'pl-10' : ''}`} 
            />
        </div>
    </div>
);

// Helper component for styled textarea fields
const TextareaField = ({ label, ...props }) => (
    <div>
        <label htmlFor={props.name} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <textarea
            {...props}
            id={props.name}
            rows="3"
            className="w-full px-4 py-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
        />
    </div>
);

export default function LabSignup() {
    const [formData, setFormData] = useState({
        name: '',
        labId: '',
        email: '',
        phone: '',
        address: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError(null);
        setSuccess(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            setLoading(false);
            return;
        }

        setLoading(true);

        try {
            // Remove confirmPassword before sending
            const { confirmPassword, ...dataToSend } = formData;
            
            // NOTE: Replace with your actual API call endpoint
            const res = await fetch("http://localhost:3001/api/auth/signup/lab", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dataToSend)
            });

            const data = await res.json();

            if (!res.ok) {
                // Throwing an error ensures the catch block executes
                throw new Error(data.msg || "Registration failed. Please ensure all details are correct.");
            }

            setSuccess('Registration successful! Redirecting to login shortly.');
            
            // Redirect to login
            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (err) {
            console.error("Lab Signup Error:", err);
            // This line ensures 'Error: Server Error' is handled properly
            setError(err.message || 'Registration failed. Check server console for details.'); 
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 font-sans">
            <div className="w-full max-w-xl mx-auto">
                {/* Header omitted for brevity, similar to your original */}
                <div className="text-center mb-8">
                    <a href="/" className="inline-flex items-center gap-2">
                        <div className="w-12 h-12 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/20">
                            <Stethoscope size={28} />
                        </div>
                        <span className="font-bold text-2xl tracking-tight text-slate-900">Curely</span>
                    </a>
                    <h2 className="mt-6 text-2xl font-bold text-slate-800">Laboratory Registration</h2>
                    <p className="mt-2 text-sm text-slate-600">Register your laboratory to partner with healthcare providers.</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200/80 space-y-6">
                    
                    <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 mb-4">Lab Details</h3>
                    <div className="grid md:grid-cols-2 gap-5">
                        {/* 💡 PROP CHANGE: Used 'icon' (lowercase) */}
                        <InputField icon={Building} label="Lab Name" name="name" value={formData.name} onChange={handleChange} placeholder="Apex Diagnostics" required />
                        <InputField icon={Building} label="Unique Lab ID" name="labId" value={formData.labId} onChange={handleChange} placeholder="LAB-45678" required />
                        <InputField icon={Mail} label="Email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="support@apex.com" required />
                        <InputField icon={Phone} label="Phone Number" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+91 98765 43210" required />
                    </div>

                    <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 pt-4 mb-4">Location & Security</h3>
                    <div className="space-y-5">
                        <TextareaField label="Full Address" name="address" value={formData.address} onChange={handleChange} placeholder="12/A, Industrial Area, Pune" required />
                    </div>
                    <div className="grid md:grid-cols-2 gap-5">
                        <InputField icon={Lock} label="Password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Create a secure password" required />
                        <InputField icon={Lock} label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm your password" required />
                    </div>

                    {/* Status Messages - Now using imported icons */}
                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg flex items-center">
                            <XCircle className="w-4 h-4 mr-2" /> {error}
                        </div>
                    )}
                    {success && (
                        <div className="text-sm text-green-700 bg-green-50 p-3 rounded-lg flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2" /> {success}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-teal-600 text-white font-semibold shadow-lg shadow-teal-600/30 hover:bg-teal-700 transition-all disabled:opacity-50" 
                        disabled={loading}
                    >
                        {loading ? "Registering Lab..." : "Register Lab Account"}
                    </button>
                </form>
                
                <p className="mt-8 text-center text-sm text-slate-600">
                    Already have an account? <Link to="/login" className="font-semibold text-teal-600 hover:text-teal-700 transition-colors">Sign In</Link>
                </p>
            </div>
        </div>
    );
}