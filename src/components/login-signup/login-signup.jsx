import React, { useState } from 'react';
import './login-signup.css';

function Login() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false); // State to check if we're currently in login or signup
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      const url = isSignUp ? `${import.meta.env.VITE_BACKEND_ADDRESS}/auth/signup` : `${import.meta.env.VITE_BACKEND_ADDRESS}/auth/login`;
      const body = isSignUp ? JSON.stringify({ email, password, businessName }) : JSON.stringify({ email, password });
      if (email === '') {
        setError('Please enter an email address');
        return;
    }
      // Check if the email address ends with ".edu"
      if (!email.endsWith('.edu')) {
          setError('This is not a valid college email address');
          return;
      }
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
              {isSignUp && (
                <div className="name-fields">
                    <input
                      type="text"
                      placeholder="First Name"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      className="name-field"
                    />
                    <input
                      type="text"
                      placeholder="Last Name"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      className="name-field"
                   />
                </div>
              )}
                {isSignUp && <input type="text" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />}
                <input type="text" placeholder="Username" value={username} onChange={e => setUserName(e.target.value)} />
                <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                <button type="submit">{isSignUp ? "Sign Up" : "Log In"}</button>
              </form>
            </div>
          </div>
        </div>
      );
}

export default Login;
