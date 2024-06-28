import React, { useState } from 'react';
import './login-signup.css';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [isSignUp, setIsSignUp] = useState(false); // State to toggle between login and signup
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = isSignUp ? `${import.meta.env.VITE_BACKEND_ADDRESS}/auth/signup` : `${import.meta.env.VITE_BACKEND_ADDRESS}/auth/login`;
        const body = isSignUp ? JSON.stringify({ email, password, businessName }) : JSON.stringify({ email, password });

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: body
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                // Redirect or update state to indicate success
            } else {
                setError(data.message);
            }
        } catch (error) {
            setError('Operation failed. Please try again.');
        }
    };

    return (
        <div className="container">
          <div className="left-panel">
            <h1>Get Started With <span className="uni-biz">Uni Biz</span></h1>
            <div className="feature">
              <p><strong>Convenient Campus Services:</strong> Find and book services and goods, from haircuts to home-cooked meals from fellow students on campus.</p>
            </div>
            <div className="feature">
              <p><strong>Support Student Businesses:</strong> Help your campus community by supporting student entrepreneurs.</p>
            </div>
            <div className="feature">
              <p><strong>Trusted Reviews:</strong> Rely on verified reviews from other students for quality services.</p>
            </div>
            <div className="feature">
              <p><strong>Seamless Connections:</strong> Sign up, browse listings, and message businesses easily with your campus credentials.</p>
            </div>
          </div>
          <div className="right-panel">
            <h1>Uni Biz</h1>
            <div className="form">
              <div className="tab">
                <button className={!isSignUp ? "active" : ""} onClick={() => setIsSignUp(false)}>Log In</button>
                <button className={isSignUp ? "active" : ""} onClick={() => setIsSignUp(true)}>Sign Up</button>
              </div>
              <form onSubmit={handleSubmit}>
                {isSignUp && <input type="text" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />}
                {isSignUp && <input type="text" placeholder="Business Name" value={businessName} onChange={e => setBusinessName(e.target.value)} />}
                <input type="text" placeholder="username" value={email} onChange={e => setEmail(e.target.value)} />
                <input type="password" placeholder="password" value={password} onChange={e => setPassword(e.target.value)} />
                <button type="submit">{isSignUp ? "Sign Up" : "Log In"}</button>
              </form>
            </div>
          </div>
        </div>
      );
}

export default Login;
