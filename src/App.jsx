import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LoginSignup from './components/login-signup/login-signup';
import Profile from './components/user-profile/profile';
import Dashboard from './components/dashboard/dashboard';
import './App.css';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginSignup />} />
                <Route path="/create-profile" element={<Profile />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="*" element={<Link to="/login" />} />
            </Routes>
        </Router>
    );
}

export default App;
