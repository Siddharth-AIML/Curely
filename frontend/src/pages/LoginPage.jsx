import React, { useState } from 'react';
import './Auth.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('customer'); // or "doctor"

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch("http://localhost:3001/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, role })
            });

            const data = await res.json();

            if (res.ok) {
                // Save token
                localStorage.setItem("token", data.token);

                if (role === "customer") {
                    window.location.href = "/dashboard/customer";
                } else if (role === "doctor" && !data.verification) {
                    window.location.href = "/pending-approval";
                } else if (role === "doctor") {
                    window.location.href = "/dashboard/doctor";
                }
            } else {
                alert(data.msg || "Login failed");
            }

        } catch (error) {
            console.error("Login error:", error);
            alert("Something went wrong. Please try again.");
        }
    };

    return (
        <div className='auth-container'>
            <h2>Login</h2>
            <form onSubmit={handleSubmit} className='auth-form'>
                <select value={role} onChange={e => setRole(e.target.value)}>
                    <option value="customer">Customer</option>
                    <option value="doctor">Doctor</option>
                </select>

                <input
                    type="email"
                    placeholder='Enter Email'
                    value={email}
                    required
                    onChange={e => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder='Enter Password'
                    value={password}
                    required
                    onChange={e => setPassword(e.target.value)}
                />
                <button type='submit'>Login</button>
                <p>
                    Don't have an account? <a href="/signup">Sign up</a>
                </p>
            </form>
        </div>
    );
}
