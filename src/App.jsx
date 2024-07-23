import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LoginSignup from './components/login-signup/login-signup';
import Profile from './components/user-profile/profile';
import Dashboard from './components/dashboard/dashboard';
import Favorites from './components/favorites/favorites';
import Home from './components/home/home';
import Bookings from './components/booking/bookings';
import Notifications from './components/notifications/notifications'
import './App.css';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginSignup />} />
                <Route path="/create-profile" element={<Profile />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/home" element={<Home />} />
                <Route path="*" element={<Link to="/login" />} />
                <Route path="/bookings" element={<Bookings />} />
                <Route path="/notifications" element={<Notifications />} />
            </Routes>
        </Router>
    );
}

export default App;
