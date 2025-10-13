import React, { useState } from "react";
import './Auth.css';

export default function CustomerSignup() {
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [consent, setConsent] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!consent) {
            setError("You must agree to the terms and condition before proceeding");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setError('');
        setLoading(true);

        try {
            const res = await fetch("http://localhost:3001/api/auth/signup/customer", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    age,
                    gender,
                    email,
                    password
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Signup failed");
            }

            alert("Signup successful! Please log in.");
            window.location.href = "/login"; // Redirect to login page
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h2>Sign-up</h2>
            <form onSubmit={handleSubmit} className='auth-form'>
                <input type="text"
                    placeholder='Full Name'
                    value={name}
                    required
                    onChange={e => setName(e.target.value)}
                />
                <input type="number"
                    placeholder='Age'
                    value={age}
                    required
                    onChange={e => setAge(e.target.value)}
                />
                <select
                    value={gender}
                    required
                    onChange={e => setGender(e.target.value)}
                >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                </select>
                <input type="email"
                    placeholder='Enter Email'
                    value={email}
                    required
                    onChange={e => setEmail(e.target.value)}
                />
                <input type="password"
                    placeholder='Set Password'
                    value={password}
                    required
                    onChange={e => setPassword(e.target.value)}
                />
                <input type="password"
                    placeholder='Confirm Password'
                    value={confirmPassword}
                    required
                    onChange={e => setConfirmPassword(e.target.value)}
                />
                <div style={{ textAlign: 'left', margin: '10px 0' }}>
                    <label>
                        <input
                            type="checkbox"
                            checked={consent}
                            onChange={e => setConsent(e.target.checked)}
                        />{' '}
                        I consent to the processing of my data.
                    </label>
                </div>
                {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
                <button type='submit' disabled={loading}>
                    {loading ? "Signing up..." : "Signup"}
                </button>
                <p>
                    Already have an account? <a href='/login'>Login</a>
                </p>
            </form>
        </div>
    );
}
