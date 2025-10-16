import React, { useState } from "react";
import { User, Mail, Lock, HeartPulse, ChevronDown, Calendar, Users } from 'lucide-react';

export default function CustomerSignup() {
    // State for form fields
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // State for UI and logic
    const [consent, setConsent] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    /**
     * Handles the form submission for customer registration.
     * Validates input and sends a POST request to the signup API.
     * @param {React.FormEvent<HTMLFormElement>} e - The form event.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();

        // --- Form Validation ---
        if (!consent) {
            setError("You must agree to the terms and conditions before proceeding.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match. Please re-enter them.");
            return;
        }

        setError(''); // Clear previous errors
        setLoading(true); // Show loading state

        try {
            const res = await fetch("https://curely-backend-api-awaygqhcgthzdnha.southindia-01.azurewebsites.net/api/auth/signup/customer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, age, gender, email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                // Throw an error to be caught by the catch block
                throw new Error(data.message || "Signup failed. Please try again.");
            }
            
            // Using a custom message box instead of alert()
            // In a real app, this would be a modal component.
            console.log("Signup successful! Please log in.");
            window.location.href = "/login"; // Redirect to login page

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false); // Hide loading state
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans">
            <div className="w-full max-w-md mx-auto">
                 {/* Logo and Header */}
                <div className="text-center mb-8">
                    <a href="/" className="inline-flex items-center gap-2">
                        <div className="w-12 h-12 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
                            <HeartPulse size={28} />
                        </div>
                        <span className="font-bold text-2xl tracking-tight text-slate-900">Curely</span>
                    </a>
                    <h2 className="mt-6 text-2xl font-bold text-slate-800">Create Your Patient Account</h2>
                    <p className="mt-2 text-sm text-slate-600">Get started by filling out the details below.</p>
                </div>

                {/* Signup Form */}
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200/80">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Input Fields */}
                        <InputField icon={<User />} type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />
                        <InputField icon={<Calendar />} type="number" placeholder="Age" value={age} onChange={e => setAge(e.target.value)} required />
                        <SelectField icon={<Users />} value={gender} onChange={e => setGender(e.target.value)} required>
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </SelectField>
                        <InputField icon={<Mail />} type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required />
                        <InputField icon={<Lock />} type="password" placeholder="Set Password" value={password} onChange={e => setPassword(e.target.value)} required />
                        <InputField icon={<Lock />} type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />

                        {/* Consent Checkbox */}
                        <div className="flex items-start">
                            <input
                                id="consent"
                                type="checkbox"
                                checked={consent}
                                onChange={e => setConsent(e.target.checked)}
                                className="h-4 w-4 mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <label htmlFor="consent" className="ml-3 text-sm text-slate-600">
                                I consent to the processing of my data as per the <a href="/privacy" className="font-medium text-emerald-600 hover:underline">Privacy Policy</a>.
                            </label>
                        </div>
                        
                        {/* Error Message Display */}
                        {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

                        {/* Submit Button */}
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition-all disabled:bg-emerald-400 disabled:cursor-not-allowed"
                        >
                            {loading ? "Creating Account..." : "Create Account"}
                        </button>
                    </form>
                </div>

                {/* Login Link */}
                <p className="mt-8 text-center text-sm text-slate-600">
                    Already have an account?{' '}
                    <a href="/login" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                        Login
                    </a>
                </p>
            </div>
        </div>
    );
}

// --- Reusable Helper Components for Form Fields ---

const InputField = ({ icon, ...props }) => (
    <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400">{icon}</div>
        <input
            {...props}
            className="w-full pl-10 pr-4 py-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
        />
    </div>
);

const SelectField = ({ icon, children, ...props }) => (
    <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400">{icon}</div>
        <select
            {...props}
            className="w-full pl-10 pr-10 py-3 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none appearance-none"
        >
            {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
    </div>
);
