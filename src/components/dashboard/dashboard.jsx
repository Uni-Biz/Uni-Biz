import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './dashboard.css';

function Dashboard() {
    const [user, setUser] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setError('No token found, please login again');
                    navigate('/login');
                    return;
                }
                const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api/info`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch user data');
                }
                const userData = await response.json();
                setUser(userData);
            } catch (error) {
                setError(error.message || 'Failed to load user data');
                console.error(error);
            }
        };
        fetchUserInfo();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const handleDeleteProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api/delete-profile`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.removeItem('token');
                navigate('/login');
            } else {
                setError(data.error || 'Error deleting profile');
            }
        } catch (error) {
            setError('Operation failed. Please try again.');
            console.error(error);
        }
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    const profile = user.profile;

    return (
        <div className="dashboard">
            <div className="sidebar">
                <div className="profile">
                    <div className='profile-pic'>
                        <img src={`data:image/png;base64,${profile.logo}`} alt="Profile Logo" />
                    </div>
                    <h3>{profile.businessName}</h3>
                    <button className="buttons">Edit Profile</button>
                    <button className="buttons" onClick={handleDeleteProfile}>Delete Profile</button>
                </div>
                <div className="menu">
                    <a href="#" className="active">Dashboard</a>
                    <a href="#">Home</a>
                    <a href="#">Favorites</a>
                    <a href="#">Bookings</a>
                </div>
            </div>
            <div className="main-content">
                <div className="header">
                    <h1>Welcome, {user.first_name} {user.last_name}</h1>
                    <div className="actions">
                        <button onClick={handleLogout}>Log Out</button>
                    </div>
                </div>
                <div className="cards">

                </div>
            </div>
        </div>
    );
}

export default Dashboard;
