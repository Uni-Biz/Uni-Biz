import React, { useState } from 'react';
import './login.css';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmitLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                // Redirect or update state to indicate login success
            } else {
                setError(data.message);
            }
        } catch (error) {
            setError('Login failed. Please try again.');
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
                <button className="active">Log In</button>
                <button>Sign Up</button>
              </div>
              <form>
                <input type="text" placeholder="username" />
                <input type="password" placeholder="password" />
                <button type="submit">Log In</button>
              </form>
            </div>
          </div>
        </div>
      );
}

export default Login;
