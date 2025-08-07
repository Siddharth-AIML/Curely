import React, {useState} from 'react';
import './Auth.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const handleSubmit = e => {
        e.preventDefault();
        alert(`Email: ${email}, Password: ${password}`);
    };
    return (
        <div className='auth-container'>
            <h2>Login</h2>
           <form onSubmit={handleSubmit} className='auth-form'>
               <input type="email"
               placeholder='Enter Email'
               value={email}
               required
               onChange={e => setEmail(e.target.value)} 
               />
               <input type="password"
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
    )
}