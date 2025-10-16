import React, { useState } from 'react';
import { Mail, Lock, LogIn, HeartPulse, ChevronDown } from 'lucide-react';

export default function LoginPage() {
    // State hooks for form inputs
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // Added 'lab' role option
    const [role, setRole] = useState('customer'); // Default role
    const [error, setError] = useState(''); // State for handling login errors
    const [loading, setLoading] = useState(false);

    /**
     * Handles the form submission for logging in the user.
     * It sends a POST request to the authentication API.
     * @param {React.FormEvent<HTMLFormElement>} e - The form event.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Reset error message on new submission
        setLoading(true);

        try {
            const res = await fetch("https://curely-backend-api-awaygqhcgthzdnha.southindia-01.azurewebsites.net/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, role })
            });

            const data = await res.json();

            if (res.ok) {
                // On successful login, save the token and role for client-side routing protection
                localStorage.setItem("token", data.token);
                localStorage.setItem("userRole", role); 

                // Redirect based on the user's role and verification status
                if (role === "customer") {
                    window.location.href = "/dashboard/customer";
                } /*else if ((role === "doctor") && !data.verification) {
                    // Doctors and Labs must be approved to access the dashboard
                    window.location.href = "/pending-approval";
                }*/else if((role === "lab")&&!data.verification) { 
           window.location.href = "/pending-approval";
                }else if (role === "doctor") {
                    window.location.href = "/dashboard/doctor";
                } else if (role === "lab") {
                    window.location.href = "/dashboard/lab";
                }

            } else {
                // If login fails, display the error message from the server
                setError(data.msg || "Login failed. Please check your credentials.");
            }

        } catch (error) {
            console.error("Login error:", error);
            setError("A network error occurred. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const roleColor = role === 'lab' ? 'teal' : 'emerald';

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans">
            <div className="w-full max-w-sm mx-auto">
                {/* Logo and Header */}
                <div className="text-center mb-8">
                    <a href="/" className="inline-flex items-center gap-2">
                        <div className={`w-12 h-12 rounded-lg bg-${roleColor}-600 flex items-center justify-center text-white shadow-md shadow-${roleColor}-600/20 transition-colors duration-300`}>
                            <HeartPulse size={28} />
                        </div>
                        <span className="font-bold text-2xl tracking-tight text-slate-900">Curely</span>
                    </a>
                    <h2 className="mt-6 text-2xl font-bold text-slate-800">Welcome Back</h2>
                    <p className="mt-2 text-sm text-slate-600">Sign in to continue to your account.</p>
                </div>

                {/* Login Form */}
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200/80">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Role Selector */}
                        <div className="relative">
                            <select 
                                value={role} 
                                onChange={e => setRole(e.target.value)}
                                className={`w-full pl-4 pr-10 py-3 text-sm border border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-${roleColor}-500 focus:border-${roleColor}-500 outline-none appearance-none transition-colors duration-300`}
                            >
                                <option value="customer">I'm a Patient</option>
                                <option value="doctor">I'm a Doctor</option>
                                <option value="lab">I'm a Laboratory</option> {/* New option */}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                        </div>

                        {/* Email Input */}
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                required
                                onChange={e => setEmail(e.target.value)}
                                className={`w-full pl-10 pr-4 py-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-${roleColor}-500 focus:border-${roleColor}-500 outline-none transition-colors duration-300`}
                            />
                        </div>

                        {/* Password Input */}
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                required
                                onChange={e => setPassword(e.target.value)}
                                className={`w-full pl-10 pr-4 py-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-${roleColor}-500 focus:border-${roleColor}-500 outline-none transition-colors duration-300`}
                            />
                        </div>

                        {/* Error Message Display */}
                        {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

                        {/* Submit Button */}
                        <button 
                            type="submit" 
                            disabled={loading}
                            className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-${roleColor}-600 text-white font-semibold shadow-lg shadow-${roleColor}-600/30 hover:bg-${roleColor}-700 transition-all transform hover:scale-[1.01] disabled:opacity-50 disabled:scale-100 disabled:shadow-none`}
                        >
                            <LogIn size={20} />
                            <span>{loading ? 'Logging in...' : 'Login'}</span>
                        </button>
                    </form>
                </div>

                {/* Sign-up Link */}
                <p className="mt-8 text-center text-sm text-slate-600">
                    Don't have an account?{' '}
                    <a href="/signup" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                        Sign up
                    </a>
                </p>
            </div>
        </div>
    );
}
