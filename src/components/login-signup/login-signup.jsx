import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login-signup.css';

function LoginSignup() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = isSignUp ? `${import.meta.env.VITE_BACKEND_ADDRESS}/user/signup` : `${import.meta.env.VITE_BACKEND_ADDRESS}/user/login`;
        const body = isSignUp ? JSON.stringify({ first_name: firstName, last_name: lastName, email, username, password }) : JSON.stringify({ username, password });

        if (!username || !password || (isSignUp && (!firstName || !lastName || !email))) {
            setError('Please fill in all fields');
            return;
        }

        if (isSignUp && !email.endsWith('.edu')) {
            setError('Please use a valid college email address');
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
                if (isSignUp) {
                    setIsSignUp(false); // Switch to login form after successful signup
                    setError('Sign up successful! Please log in.');
                } else {
                    localStorage.setItem('token', data.token);
                    navigate(data.redirect);
                }
            } else {
                setError(data.error || 'Unknown error occurred');
            }
        } catch (error) {
            setError('Operation failed. Please try again.');
            console.error(error);
        }
    };

    return (
        <div className="container">
            <div className="left-panel">
                <h1>Get Started With <span className="uni-biz">Uni Biz</span></h1>
                <div class="feature">
                    <span className="wand">
                        <i class="fa-solid fa-wand-magic-sparkles fa-3x"></i>
                    </span>
                    <span>
                        <p><strong>Convenient Campus Services:</strong> Find and book services and goods, from haircuts to home-cooked meals from fellow students on campus.</p>
                     </span>
                </div>

                <div class="feature">
                    <span className="plant">
                        <i class="fa-solid fa-seedling fa-3x"></i>
                    </span>
                    <span>
                        <p><strong>Support Student Businesses:</strong> Help your campus community by supporting student entrepreneurs.</p>
                    </span>
                </div>

            <div class="feature">
                <span className="star">
                    <i class="fa-solid fa-star fa-3x"></i>
                </span>
                <span>
                    <p><strong>Trusted Reviews:</strong> Rely on verified reviews from other students for quality services.</p>
                </span>
            </div>

            <div class="feature">
                <span className="chain">
                    <i class="fa-solid fa-link fa-3x"></i>
                </span>
                <span>
                    <p><strong>Seamless Connections:</strong> Sign up, browse listings, and message businesses easily with your campus credentials.</p>
                </span>
            </div>
        </div>
            <div className="right-panel">
                <h1>Uni Biz</h1>
                <div className="form">
                    <div className="tab">
                        <button className={!isSignUp ? "active" : ""} onClick={() => setIsSignUp(false)}>Log In</button>
                        <button className={isSignUp ? "active" : ""} onClick={() => setIsSignUp(true)}>Sign Up</button>
                    </div>
                    {error && <p className="error">{error}</p>}
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
                        {isSignUp && (
                            <input
                                type="text"
                                placeholder="Email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        )}
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={e => setUserName(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                        <button type="submit">{isSignUp ? "Sign Up" : "Log In"}</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default LoginSignup;
